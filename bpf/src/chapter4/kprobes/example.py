from bcc import BPF

bpf_source = """
#include <uapi/linux/ptrace.h> 

int do_sys_execve(struct pt_regs *ctx){
    char comm[16];
    bpf_get_current_comm(&comm, sizeof(comm));
    bpf_trace_printk("executing program: %s", comm);
    return 0;
}
"""

bpf = BPF(text=bpf_source) # 将BPF程序加载到内核中。

# 将程序与execve syscall关联。
# 这个系统调用的名称在不同的内核版本中发生了变化，BCC提供了一个函数来检索这个名称，而不必记住正在运行的内核版本。
execve_function = bpf.get_syscall_fnname("execve")
bpf.attach_kprobe(event = execve_function, fn_name = "do_sys_execve")
bpf.trace_print()