[toc]

# 前言

**来源**：[Linux Observability with BPF](https://www.oreilly.com/library/view/linux-observability-with/9781492050193/)

整理下本书的第五章：BPF Utilities

之前我们讨论了如何编写BPF程序。本章，我们将介绍几种现成的工具。重点介绍BPFTool的使用。不介绍BPFTrace、kubectl-trace、ebpf Exporter。

<br>

# BPFTool

## 安装

我并不建议从源码安装。但仍然给出通过源码安装的方式。

```shell
# 获取内核源码。会安装在/usr/src目录下
sudo apt install linux-source

# 解压

# 进入tool目录
cd tools/bpf/bpftool

# 安装bpf
make && sudo make install
```

使用包管理器安装比较方便。[linux-tools-generic](https://ubuntu.pkgs.org/20.04/ubuntu-main-amd64/linux-tools-generic_5.4.0.26.32_amd64.deb.html)提供linux tools，包含bpftool

```shell
# 安装
sudo apt install linux-tools-$(uname -r)

# 检查安装
bpftool version
```

<br>

## 使用

看bpftool的manual page 是最靠谱的。我们[man bpftool](https://man.archlinux.org/man/bpftool.8.en)

```shll
man bpftool
```

```shell
# 输出如下
SYNOPSIS
          bpftool [OPTIONS] OBJECT { COMMAND | help }
          bpftool batch file FILE
          bpftool version
          OBJECT := { map | program | cgroup | perf | net | feature }
          OPTIONS := { { -V | --version } | { -h | --help } | { -j | --json } [{ -p | --pretty }] }
          MAP-COMMANDS := { show | list | create | dump | update | lookup | getnext | delete | pin | event_pipe | help }
          PROG-COMMANDS := { show | list | dump jited | dump xlated | pin | load | attach | detach | help }
          CGROUP-COMMANDS := { show | list | attach | detach | help }
          PERF-COMMANDS := { show | list | help }
          NET-COMMANDS := { show | list | help }
          FEATURE-COMMANDS := { probe | help }

SEE ALSO
          bpf(2), bpf-helpers(7), bpftool-prog(8), bpftool-map(8), bpftool-cgroup(8), bpftool-feature(8), bpftool-net(8), bpftool-perf(8), bpftool-btf(8)
```

所以，根据`OBJECT`，依次查看`map | program | cgroup | perf | net | feature`就好。

<br>

### feature

```shell
man bpftool-feature
```

bpftool feature：用于检查Linux内核或网络设备的eBPF相关参数的工具。

```shell
bpftool feature
```

```shell
# 输出如下
Scanning system configuration...
bpf() syscall for unprivileged users is enabled
JIT compiler is enabled
JIT compiler hardening is disabled
JIT compiler kallsyms exports are disabled
Global memory limit for JIT compiler for unprivileged users is 264241152 bytes
...
Scanning system call availability...
bpf() syscall is available
...
Scanning eBPF program types...
...
Scanning eBPF map types...
...
Scanning eBPF helper functions...
    eBPF helpers supported for program type socket_filter:
    eBPF helpers supported for program type kprobe:
    eBPF helpers supported for program type sched_cls:
    eBPF helpers supported for program type sched_act:
    eBPF helpers supported for program type tracepoint:
    eBPF helpers supported for program type xdp:
    eBPF helpers supported for program type perf_event:
    eBPF helpers supported for program type cgroup_skb:
    eBPF helpers supported for program type lwt_in:
    eBPF helpers supported for program type lwt_out:
    eBPF helpers supported for program type lwt_xmit:
    eBPF helpers supported for program type sock_ops:
    eBPF helpers supported for program type sk_skb:
    eBPF helpers supported for program type cgroup_device:
    eBPF helpers supported for program type sk_msg:
    eBPF helpers supported for program type raw_tracepoint:
    eBPF helpers supported for program type cgroup_sock_addr:
    eBPF helpers supported for program type lwt_seg6local:
    eBPF helpers supported for program type lirc_mode2:
    eBPF helpers supported for program type sk_reuseport:
    eBPF helpers supported for program type flow_dissector:
    eBPF helpers supported for program type cgroup_sysctl:
    eBPF helpers supported for program type raw_tracepoint_writable:
    eBPF helpers supported for program type cgroup_sockopt:
```

在此输出中，您可以看到我们的系统允许非特权用户执行syscall bpf。您还可以看到已启用JIT。功能输出还向您显示系统中启用了哪些程序类型和映射类型，还有很多帮助函数。

<br>

### program

这里的bpftool man文档有点错误。OBJECT中的program应该是prog

```shell
man bpftool-prog
```

bpftool prog-用于检查和简单操作eBPF程序的工具。

**查看程序**：

```shell
# 检查系统中正在运行的bpf程序
sudo bpftool prog show

# 输出如下
3: cgroup_skb  tag 6deef7357e7b4530  gpl
	loaded_at 2021-04-15T14:09:34+0800  uid 0
	xlated 64B  jited 61B  memlock 4096B
4: cgroup_skb  tag 6deef7357e7b4530  gpl
	loaded_at 2021-04-15T14:09:34+0800  uid 0
	xlated 64B  jited 61B  memlock 4096B
```

冒号前的左侧数字是程序标识符；cgroup_skb是[bpf 程序](https://blog.csdn.net/sinat_38816924/article/details/115607570#t14)；xlated是eBPF指令；jited是jited image (host machine code) of the program；memlock我不知道是什么(占用内存？)

```shell
# 如果需要过滤感兴趣的信息，可以如下操作
# bpftool prog show --json id 3 | jq -c '[.id, .type, .loaded_at]'
```

另外，知道程序的id，可以用来查看它的BPF字节码，或者生成[dot](https://blog.csdn.net/sinat_38816924/article/details/113621425#t3)文件用于图形化显示。

```shell
# bpftool prog dump xlated id 52
 
# bpftool prog dump xlated id 52 visual &> output.out
# dot -Tpng output.out -o visual-graph.png
```

**加载程序**：

load程序，会将OBJ pin住。因此命令结束后，它仍在运行。

```shell
bpftool prog { load | loadall } OBJ PATH [type TYPE] [map {idx IDX | name NAME} MAP] [dev NAME] [pinmaps MAP_DIR]
```

<br>

### map

```shell
man bpftool-map
```

bpftool map：用于检查和简单操作eBPF map的工具

查看map、创建map、更新元素、删除元素、将预先创建的映射附加到新程序等。

```shell
# bpftool map { show | list } [MAP]
# bpftool map create FILE type TYPE key KEY_SIZE value VALUE_SIZE entries MAX_ENTRIES name NAME [flags FLAGS] [dev NAME]
# bpftool map update MAP [key DATA] [value VALUE] [UPDATE_FLAGS]
# bpftool map delete MAP key DATA
# bpftool prog { load | loadall } OBJ PATH [type TYPE] [map {idx IDX | name NAME} MAP] [dev NAME] [pinmaps MAP_DIR]
```

<br>

### perf

```man
man bpftool-perf
```

bpftool perf：用于检查与perf相关的bpf prog attachments的工具。perf子命令列出了连接到[系统跟踪点](https://blog.csdn.net/sinat_38816924/article/details/115731456)的所有程序，例如kprobes，uprobes和tracepoint。您可以通过运行bpftool perf show查看清单。

<br>

### net

```shell
man bpftool-net
```

pftool net：用于检查netdev/tc相关bpf prog attachments的工具。

> net子命令列出了附加到XDP和流量控制的程序。其他附件，例如套接字过滤器和复用端口程序，只能使用iproute2进行访问。您可以使用bpftool net show列出XDP和TC的附件，就像在其他BPF对象中看到的一样。

[你的第一个XDP BPF 程序](https://davidlovezoe.club/wordpress/archives/937) | [你的第一个TC BPF 程序](https://davidlovezoe.club/wordpress/archives/952)

通过上面两个文章，我大概了解了下XDP 和 TC。

> XDP是RX链路的第一层，XDP只能处理入站流量。TC是TX链路上的第一层，它是离网卡最近的可以控制全部流向的控制层(出入都可以控制)。
> XDP可以比TC更早的处理入栈流量。

<br>

### cgroup

```shell
man bpftool-cgroup
```

bpftool cgroup：用于检查和简单操作eBPF程序的工具

这里的cgroup子命令，我不知道这样考虑对不对。比如现在我的系统中启动一个[容器](https://blog.csdn.net/sinat_38816924/article/details/111354993#t21)，这个容器有它自己的namespace，cgroup。我想使得我的bpf对容器起作用，而不是对整个主机起作用。此时我们可以将bpf程序附加在cgroup上

<br>

### batch

```shell
bpftool batch file FILE
```

以批处理方式加载命令。使用批处理模式，您可以将要执行的所有命令写入文件，然后一次运行所有命令。您也可以在文件中以＃开头写注释。但是，此执行模式不是原子的。 命令逐行执行，如果其中一个命令失败，它将中止执行，使系统保持运行最新成功命令后的状态。

<br>

# 其他BFP工具

* [BPFTrace](https://github.com/iovisor/bpftrace/blob/master/docs/reference_guide.md#3--associative-arrays)：BPF可以使用c语言，python。BPFTrace是BPF领域专用语言。BPFTrace是执行日常任务的强大工具。它的脚本语言为您提供了足够的灵活性来访问系统的各个方面，而无需进行手动将BPF程序编译和加载到内核的操作。（对于用户使用而言，确实挺方便。一行程序便可以解决一个小问题。）
* [kubectl-trace](https://github.com/iovisor/kubectl-trace)：Kubernetes命令行kubectl的绝佳插件。它可以帮助您在Kubernetes集群中调度BPFTrace程序