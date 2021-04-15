[toc]

## 前言

**来源**：[Linux Observability with BPF](https://www.oreilly.com/library/view/linux-observability-with/9781492050193/)

整理下本书的第三章：Tracing with BPF

建议先阅读：[EBPF文章翻译(2)——BCC介绍(附实验环境)](https://davidlovezoe.club/wordpress/archives/874)

另外，使用BPF可以看到，你系统中某个地方正在发生的事情。这很cool，是不是。动漫[《工作细胞》](https://www.bilibili.com/bangumi/play/ss24588/)讲述一个身体中细胞正在经历的事情。这两者似乎有异曲同工之妙。

<br>

## 摘要

代码根据运行环境的不同可以分为：内核空间代码，用户空间代码。

1. 对内核空间的代码进行探测，可以分为两种：

   * 在执行前插入探测程序，称为kprobes。
   * 在执行后插入探测程序，称为kretprobes。

   但是内核的接口可能会改变，导致探测代码在下一版本可能失效。所以，内核引入了tracepoints。Tracepoints是内核代码中的静态标记，可用于在运行的内核中附加代码。与k(ret)probes的主要区别在于，当kernel开发人员在内核中实现更改时，它们是由kernel开发人员编码的；我们可以在 /sys/kernel/debug/tracing/events中看到所有的available tracepoints。【5.4.0-70中并没有bpf这个目录。】

2. 对用户空间的代码进行探测，可以分为两种：

   * 在执行前插入探测程序，称为uprobes
   * 在执行后插入探测程序，称为uretprobes。

   同样，用户空间的代码接口也可能改变，导致探测代码失效。所以，程序员选择在编写用户空间代码的时候插入Tracepoints。可以在外部选择开启探测与否。

<br>

## 使用BPF进行跟踪

在软件工程中，跟踪是一种为分析和调试收集数据的方法。目的是在运行时为将来的分析提供有用的信息。使用BPF进行跟踪的主要优点是，您几乎可以访问Linux内核和应用程序中的任何信息。与其他跟踪技术相比，BPF为系统的性能和延迟增加了最少的开销，而且它不需要开发人员仅为了从他们那里收集数据而修改他们的应用程序。

从本章开始，我们将使用一个强大的工具箱来编写BPF程序，[BPF Compiler Collection (BCC)](https://github.com/iovisor/bcc)。BCC是一组使构建BPF程序更加可预测的组件。即使您掌握了Clang和LLVM，您也可能不想花费更多的时间来构建相同的实用程序，并确保BPF验证器不会拒绝您的程序。BCC为公共结构（如Perf事件映射）提供可重用的组件，并与LLVM后端集成以提供更好的调试选项。除此之外，BCC还包括几种编程语言的绑定；我们将在示例中使用Python。这些绑定允许您用高级语言编写BPF程序的用户空间部分，从而生成更有用的程序。

<font color=red>我暂时还不咋会使用BCC这个工具。BCC仓库中的doc我还没看。下面暂时仅涉及BCC的简单使用。</font>

暂时简单[安装](https://github.com/iovisor/bcc/blob/master/INSTALL.md#ubuntu---binary)下这个工具，这个安装过程，还有涉及挺多知识点。我回头单开一篇。

```shell
# sudo apt upgrade
sudo apt install bpfcc-tools linux-headers-$(uname -r)
```

<bc>

### kprobes

Kprobes允许您在执行任何内核指令之前插入BPF程序。

下面的程序目的：当要执行execve系统调用的时候，打印“内核正在运行的当前命令的名称”。

下面程序的文件名：example.py

```python
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
# execve系统调用的名称在不同的内核版本中发生了变化，BCC提供了get_syscall_fnname函数来检索这个名称，而不必记住正在运行的内核版本。
execve_function = bpf.get_syscall_fnname("execve")
bpf.attach_kprobe(event = execve_function, fn_name = "do_sys_execve")
bpf.trace_print()
```

我们运行这个程序并查看输出。

```shell
➜  sudo python3 example.py
b' sogoupinyinServ-9315    [002] ....  4785.168205: 0: executing program: sogoupinyinServ
zsh-9320    [003] ....  4785.419445: 0: executing program: zsh
env-9370    [001] ....  4786.090141: 0: executing program: env
```

我使用`zsh-9320    [003] ....  4785.419445: 0: executing program: zsh`，分析下输出。这里参考了[EBPF文章翻译(2)——BCC介绍(附实验环境)](https://davidlovezoe.club/wordpress/archives/874)。至于这个作为这个分析支持的官方文档位置，我暂时还不知道。

* `zsh`是触发`execve`时的应用程序名称
* `9320`是这个应用程序的PID
* `[003]`表示运行在第三个CPU核心上
* `executing program: zsh`是我们打印的内容
* 其他内容，我暂时不知道。

<br>

### kretprobes

kretprobes探测点在内核函数返回的时候被调用。

代码和上面相似。

```python
from bcc import BPF

# kretprobes 探测点在内核函数返回的时候被调用

bpf_source = """
#include <uapi/linux/ptrace.h>

int ret_sys_execve(struct pt_regs *ctx) {
  int return_value;
  char comm[16];
  bpf_get_current_comm(&comm, sizeof(comm));
  return_value = PT_REGS_RC(ctx);

  bpf_trace_printk("program: %s, return: %d\\n", comm, return_value);
  return 0;
}
"""

bpf = BPF(text=bpf_source)
execve_function = bpf.get_syscall_fnname("execve")
bpf.attach_kretprobe(event=execve_function, fn_name="ret_sys_execve")
bpf.trace_print()
```

<br>

### tracepoints

[Event Tracing](https://www.kernel.org/doc/html/latest/trace/events.html)：Tracepoints可以在不创建自定义内核模块的情况下使用，以使用`event tracing infrastructure`注册探测函数。

[Notes on Analysing Behaviour Using Events and Tracepoints](https://www.kernel.org/doc/html/latest/trace/tracepoint-analysis.html#lower-level-analysis-with-pcl)：tracepoints还可以相互组合。我们可以在 /sys/kernel/debug/tracing/events中看到所有的available tracepoints。

书中给的示例代码：一个BPF程序，它跟踪系统中加载其他BPF程序的所有应用程序

```python
from bcc import BPF

bpf_source = """
int trace_bpf_prog_load(void *ctx) {
  char comm[16];
  bpf_get_current_comm(&comm, sizeof(comm));

  bpf_trace_printk("%s is loading a BPF program", comm);
  return 0;
}
"""

bpf = BPF(text = bpf_source)
bpf.attach_tracepoint(tp = "bpf:bpf_prog_load", fn_name = "trace_bpf_prog_load")
bpf.trace_print()
```

<font color=red>我的events目录中没有bpf目录</font>。所以整个程序无法运行。我想着内否自行添加。所以我翻阅上面两个链接，但是我并没有找到答案。所以，我暂时不知道如何解决这个问题。

<br>

### uprobes

uprobes为用户空间函数的探针。bcc中使用[attach_uprobe()](https://github.com/iovisor/bcc/blob/master/docs/reference_guide.md#4-attach_uprobe)

书中示例：对一个go代码的main函数，进行探针检测的。

我们先安装下golang：[Download and install](https://golang.org/doc/install) 、[Tutorial: Get started with Go](https://golang.org/doc/tutorial/getting-started)

```shell
cd ~
wget https://golang.org/dl/go1.16.3.linux-amd64.tar.gz
sudo rm -rf /usr/local/go 
sudo tar -C /usr/local -xzf go1.16.3.linux-amd64.tar.gz

echo "export PATH=$PATH:/usr/local/go/bin" >> ~/.profile
source ~/.profile

go version
rm -f ~/go1.16.3.linux-amd64.tar.gz
```

```shell
# 创建go.mod文件来对代码进行依赖项跟踪
cd uprobes
go mod init uprobes
```

再来写一个简单的go代码，我们使用BPF探针检测其中的main函数。

```go
package main // Declare a main package

import "fmt" // Import the popular fmt package

func main()  { // Implement a main function to print a message to the console
    fmt.Println("Hello, BPF")
}
```

```shell
# go run .

# 编译生成可执行文件
go build -o hello-bpf main.go
```

如果报错`fatal error: sys/sdt.h: 没有那个文件或目录`，安装下`systemtap-sdt-dev`就好。

```shell
sudo apt-get install systemtap-sdt-dev
```

> [systemtap-sdt-dev_3.1-3ubuntu0.1_amd64.deb](https://ubuntu.pkgs.org/20.04/ubuntu-universe-amd64/systemtap-sdt-dev_4.2-3_amd64.deb.html)
>
> ```
> 该软件包包含头文件和可执行文件（dtrace），可用于将静态探针添加到用户空间应用程序中
> ```

接着，我们使用编写一个BPF程序，对上面go函数中的main函数进行检测。

```python
from bcc import BPF
import os

bpf_source = """
int trace_go_main(struct pt_regs *ctx) {
  u64 pid = bpf_get_current_pid_tgid();
  bpf_trace_printk("New hello-bpf process running with PID: %d\\n", pid);
  return 0;
}
"""

bpf = BPF(text = bpf_source)
bpf.attach_uprobe(name = "./hello-bpf", sym = "main.main", fn_name = "trace_go_main")
bpf.trace_print()
```

这里，我们简单看下[attach_uprobe](https://github.com/iovisor/bcc/blob/master/docs/reference_guide.md#4-attach_uprobe)函数的参数。

* `name = "./hello-bpf"`：被检测程序的地址。如果想检测库的话，也成。自行参看官方文档。

* `sym = "main.main"`：sym是检测的address。**这里我不是很清楚**。

  使用nm查看上面编译文档go代码。

  ```shell
  ➜  uprobes git:(master) ✗ nm hello-bpf | grep main
  0000000000535ec0 D main..inittask
  0000000000497660 T main.main
  0000000000434d20 T runtime.main
  000000000045e460 T runtime.main.func1
  000000000045e4c0 T runtime.main.func2
  000000000054ab50 B runtime.main_init_done
  00000000004d8828 R runtime.mainPC
  0000000000578210 B runtime.mainStarted
  ```

* `fn_name = "trace_go_main"`：bpf程序名。

先运行这个python的bpf程序。接着，我们运行hello-bpf程序。此时可以example.py程序的输出：

```shell
b'       hello-bpf-13691   [002] ....  8925.396573: 0: New hello-bpf process running with PID: 13691'
```

<br>

### uretprobes

将uprobes和uretprobes结合起来可以编写更复杂的BPF程序。它们可以让您更全面地了解系统中运行的应用程序。当您可以在函数运行之前和完成之后立即注入跟踪代码时，就可以开始收集更多数据并度量应用程序行为。一个常见的用例是测量函数执行所需的时间，而不必更改应用程序中的一行代码。

```python
from bcc import BPF

# use the application PID as the table key,

bpf_source = """
BPF_HASH(cache, u64, u64);

int trace_start_time(struct pt_regs *ctx) {
  u64 pid = bpf_get_current_pid_tgid();
  u64 start_time_ns = bpf_ktime_get_ns();
  cache.update(&pid, &start_time_ns);
  return 0;
}
"""

bpf_source += """
int print_duration(struct pt_regs *ctx) {
  u64 pid = bpf_get_current_pid_tgid();
  u64 *start_time_ns = cache.lookup(&pid);
  if (start_time_ns == 0) {
    return 0;
  }
  u64 duration_ns = bpf_ktime_get_ns() - *start_time_ns;
  bpf_trace_printk("Function call duration: %d\\n", duration_ns);
  return 0;
}
"""

bpf = BPF(text = bpf_source)
bpf.attach_uprobe(name = "../uprobes/hello-bpf", sym = "main.main", fn_name = "trace_start_time")
bpf.attach_uretprobe(name = "../uprobes/hello-bpf", sym = "main.main", fn_name = "print_duration")
bpf.trace_print()
```

```shell
# 输出如下
b'       hello-bpf-14768   [001] ....  9515.517235: 0: Function call duration: 29605'
```

<br>

### user statically defined tracepoints (USDTs)

用户静态定义的跟踪点（User Statically Defined Tracepoints，USDT）为用户空间中的应用程序提供了静态跟踪点。这是检测应用程序的便捷方法，因为它们为您提供了BPF提供的跟踪功能的低开销入口点。USDT通过[DTrace](https://illumos.org/books/dtrace/chp-intro.html#chp-intro)进行了普及，DTrace是最初由Sun Microsystems开发的一种用于Unix系统的动态检测的工具。 DTrace直到最近由于许可问题才在Linux中可用。

比如下面这个程序。

```shell
#include <sys/sdt.h>

int main(int argc, char const *argv[]) {
    DTRACE_PROBE("hello-usdt", "probe-main");
    return 0;
}
```

（<font color=blue>这个程序，我没有执行成功</font>。可以参考：[bpf 跟踪功能——上手 USDT](https://blog.csdn.net/Longyu_wlz/article/details/109902171#t7)。目测比较难，我搞不定，跳过。）

**USDT要求开发人员在代码中插入指令，内核将这些指令用作执行BPF程序的陷阱**。DTRACE_PROBE注册tracepoint。内核使用这个tracepoint，插入BPF回调函数。此宏中的第一个参数是报告跟踪的程序。第二个是我们报告的trace的名字。这样，可以访问程序运行时候的trace data.

BPF程序可以如下这样搭配使用。

```python
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
```

<br>

## 可视化追踪数据

上面可以得到追踪数据。数据可视化为图像，观看更加直观。书上给出了三个：

* [Flame Graphs](https://github.com/brendangregg/flamegraph) | [如何读懂火焰图？-- 阮一峰](https://www.ruanyifeng.com/blog/2017/09/flame-graph.html)
* Histograms
* Perf Events

鉴于我的bcc使用过程坑坑洼洼，暂时跳过数据可视化部分。