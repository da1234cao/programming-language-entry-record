/**
 * 下载地址：https://davidlovezoe.club/wordpress/archives/1044#%E5%BC%80%E5%8F%91BPF_Map%E7%A4%BA%E4%BE%8B%E7%A8%8B%E5%BA%8F
*/

#define KBUILD_MODNAME "foo"
#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/if_packet.h>
#include <linux/if_vlan.h>
#include <linux/ip.h>
#include <linux/in.h>
#include <linux/tcp.h>
#include <linux/udp.h>
#include "bpf_helpers.h"
#include "bpf_endian.h"
#include "xdp_ip_tracker_common.h"

#define bpf_printk(fmt, ...)                       \
    ({                                             \
        char ____fmt[] = fmt;                      \
        bpf_trace_printk(____fmt, sizeof(____fmt), \
                         ##__VA_ARGS__);           \
    })

/// 创建一个map
struct bpf_map_def SEC("maps") tracker_map = {
    .type = BPF_MAP_TYPE_HASH,
    .key_size = sizeof(struct pair),
    .value_size = sizeof(struct stats),
    .max_entries = 2048,
};

/// 网络包进行分析
/// 把源地址和目的地址联合起来作为BPF Map的key;
/// 这两者往返之间数据包的个数和大小作为value；
static __always_inline bool parse_and_track(bool is_rx, void *data_begin, void *data_end, struct pair *pair)
{
    struct ethhdr *eth = data_begin;

    if ((void *)(eth + 1) > data_end)
        return false;

    if (eth->h_proto == bpf_htons(ETH_P_IP))
    {
        struct iphdr *iph = (struct iphdr *)(eth + 1);
        if ((void *)(iph + 1) > data_end)
            return false;

        pair->src_ip = is_rx ? iph->daddr : iph->saddr;
        pair->dest_ip = is_rx ? iph->saddr : iph->daddr;

        // update the map for track
        struct stats *stats, newstats = {0, 0, 0, 0};
        long long bytes = data_end - data_begin;

        stats = bpf_map_lookup_elem(&tracker_map, pair);
        if (stats)
        {
            if (is_rx)
            {
                stats->rx_cnt++;
                stats->rx_bytes += bytes;
            }
            else
            {
                stats->tx_cnt++;
                stats->tx_bytes += bytes;
            }
        }
        else
        {
            if (is_rx)
            {
                newstats.rx_cnt = 1;
                newstats.rx_bytes = bytes;
            }
            else
            {
                newstats.tx_cnt = 1;
                newstats.tx_bytes = bytes;
            }
            bpf_map_update_elem(&tracker_map, pair, &newstats, BPF_NOEXIST);
        }
        return true;
    }
    return false;
}


SEC("xdp_ip_tracker")
int _xdp_ip_tracker(struct xdp_md *ctx)
{
    // the struct to store the ip address as the keys of bpf map
    struct pair pair;

    bpf_printk("starting xdp ip tracker...\n");

    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    // pass if the network packet is not ipv4
    if (!parse_and_track(true, data, data_end, &pair))
        return XDP_PASS;

    return XDP_DROP;
}

char _license[] SEC("license") = "GPL";