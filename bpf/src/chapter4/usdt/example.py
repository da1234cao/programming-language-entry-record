from bcc import BPF, USDT

# 知道二进制文件中支持的跟踪点后，
# 可以使用与前面示例中类似的方式将BPF程序附加到这些跟踪点上：

bpf_source = """
#include <uapi/linux/ptrace.h>
int trace_binary_exec(struct pt_regs *ctx) {
  u64 pid = bpf_get_current_pid_tgid();
  bpf_trace_printk("New hello_usdt process running with PID: %d", pid);
}
"""

# 创建一个USDT对象；我们在前面的示例中没有这样做。USDT不是BPF的一部分
usdt = USDT(path = "./hello_usdt")

# 在我们的应用程序中，将跟踪程序执行的BPF函数附加到探测器上。
usdt.enable_probe(probe = "probe-main", fn_name = "trace_binary_exec")

# 使用我们刚刚创建的跟踪点定义初始化我们的BPF环境。
# bpf = BPF(text = bpf_source, usdt = usdt)
bpf = BPF(text = bpf_source, usdt_contexts = [usdt])

bpf.trace_print()
