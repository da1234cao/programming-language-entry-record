[toc]

# 前言

这是我运行"hello  world"这类程序以来，遇到最麻烦的一个。因为我的知识体系相对于这个工作有所欠缺。

这里的难点在于编译部分。<font color=red>需要对linux kernel的编译过程有所了解。还需要了解linux kernel中的tools，如何从源码进行编译安装</font>。**这也是本文所欠缺的地方**。

网上的编译方式有两类。

第一类：将自行编写的程序放在内核源码中的合适位置，借用linux kernel中的编译方式进行编译，可以参考[编译运行Linux内核源码中的eBPF示例代码](https://cloudnative.to/blog/compile-bpf-examples/)。

第二类：自己编写编译过程，使用编译参数以指向内核库文件和头文件位置，可以参考[运行第一个 bpf 程序](https://blog.csdn.net/Longyu_wlz/article/details/109900096)

我感觉还有第三类：即，将需要的库文件和头文件安装在系统的合适位置。这样可以像调用本地库函数的方式，调用这些需要的内核工具函数。当然这种方式存在一个缺点。缺点在于库和头文件的将来可能需要手动更新。

本文包含第一类，第二类，尝试第三类。因为我暂时对linux kernel的编译过程和内核tools的编译安装方式不了解，所以解决不了第三类。我也想快点推过这一章，避免深陷另一个知识点。

**来源**：[Linux Observability with BPF](https://www.oreilly.com/library/view/linux-observability-with/9781492050193/)

这里整理下该书第一章：Running Your First BPF Programs

本文代码见：[hello_world](../src/chapter2/hello_world)

另外，我的系统环境如下所示：

```shell
➜  uname -a
Linux dacao-Vostro-23-3340 5.4.0-70-generic #78-Ubuntu SMP Fri Mar 19 13:29:52 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
```

<br>

# 准备工作

<br>

## 内核源码准备

下载内核源码，并编译我们需要的内容。

<br>

### 下载内核源码

首先是现在内核源码。我在另一篇blog中整理了下：[ubuntu获取源码方式](https://blog.csdn.net/sinat_38816924/article/details/115498707)

命令如下所示：

```shell
# 下载内核源码到/usr/src目录
sudo apt install linux-source

# 进入源码目录进行解压
sudo tar -jxvf linux-source-5.4.0.tar.bz2
```

<br>

### 阅读README.rst

因为我们需要编写bpf程序。所以，我们需要阅读下源码目录中sample/bpf/README.rst。它包含`eBPF sample programs`的相关信息。下面，我从中摘出几点。

* sample/bpf目录下的bpf程序，使用了libbpf库。这个库位于tools/lib/bpf。
* 使用`make samples/bpf/`编译sample/bpf目录下的bpf程序

<br>

### 编译sample/bpf目录下的bpf程序

如果直接运行`make samples/bpf/`，会提示需要`.config`文件。这个是内核的配置文件。

对于内核编译，我不咋熟悉，所以这里不展开介绍。可以按照提示运行`make menuconfig`、`make xconfig`等。我选择拷贝主机的内核配置文件到内核源码的目录中。

```shell
sudo cp -a /boot/config-$(uname -r) ./.config
```

排除问题之后，我们接着尝试编译sample中bpf程序。

```shell
# 按照README.rst中的说明进行编译
➜  sudo make samples/bpf/
...
  CALL    scripts/checksyscalls.sh
  CALL    scripts/atomic/check-atomics.sh
  DESCEND  objtool
make[2]: 对“samples/bpf/”无需做任何事。

# 不知道为啥上面没有编译samples/bpf/下的内容
# 网上找了下，使用如下编译
# 这里也记录下警告，万一将来出现问题，好找原因。
➜  sudo make M=samples/bpf

Warning: Kernel ABI header at 'tools/include/uapi/linux/netlink.h' differs from latest version at 'include/uapi/linux/netlink.h'
Warning: Kernel ABI header at 'tools/include/uapi/linux/if_link.h' differs from latest version at 'include/uapi/linux/if_link.h'

  WARNING: Symbol version dump ./Module.symvers
           is missing; modules will have no dependencies and modversions.

# 我使用diff查看了区别，如下所示
5c5
< #include <linux/kernel.h>
---
> #include <linux/const.h>

537a538
> 	IFLA_VXLAN_FAN_MAP = 33,
```

<br>

## 了解文件系统结构

首先通过[Filesystem Hierarchy Standard](https://www.pathname.com/fhs/)了解库文件和头文件相关的文件系统结构。接着查看gcc和clang默认的头文件和库的搜索路径，便于后面编译参数的配置。

<br>

### 头文件和库的文件结构

* /lib目录包含引导系统和运行根文件系统中的命令所需的共享库映像，即通过/bin和/sbin中的二进制文件。
* /lib\<qual\>：备用格式基本共享库。在支持多种二进制格式的系统上，/lib目录可能有一种或多种变体，这些二进制格式需要单独的库。比如，/lib32、/lib64
* /usr/lib：用于编程和包的库。应用程序可以使用/usr/lib下的一个子目录。如果应用程序使用子目录，则应用程序独占使用的所有与体系结构相关的数据必须放在该子目录中。
* /usr/lib\<qual\>对于备用二进制格式执行与/usr/lib相同的角色，只是不需要符号链接/usr/lib\<qual\>/sendmail和/usr/lib\<qual\>/X11
* /usr/local层次结构供系统管理员在本地安装软件时使用。当系统软件更新时，它需要防止被覆盖。它可用于可在一组主机之间共享但在/usr中找不到的程序和数据。本地安装的软件必须放在/usr/local而不是/usr中，除非安装它是为了替换或升级/usr中的软件。
* /usr/local/lib、/usr/local/lib\<qual\>、/usr/local/inlcude，分别用于放置本地的库和头文件
* /usr/include：标准include文件的目录

<br>

### 默认的头文件和库搜索路径

对于gcc和clang，查看默认的库搜索路径。方式是，编译的时候加上-v参数。我们随手编写一个简单的c程序，加上-v参数，正确编译一下。这里只是用它来查看下头文件和库默认的搜索路径。

```c
// tmp.c
#include <stdio.h>
int main(void){
    printf("hell Mr tree\n");
    return 0;
}
```

```shell
➜  gcc -v -g -o tmp tmp.c
```

对于gcc和clang，查看下默认的库搜索路径。方式是，编译的时候加上-v参数。我们任意找一个c程序，加上-v参数，正确编译一下。这里只是用于查看下头文件和库默认的搜索路径。

```shell
➜  gcc -v -g -o tmp tmp.c
```

```shell
# 输入如下
...
GGC heuristics: --param ggc-min-expand=100 --param ggc-min-heapsize=131072
ignoring nonexistent directory "/usr/local/include/x86_64-linux-gnu"
ignoring nonexistent directory "/usr/lib/gcc/x86_64-linux-gnu/9/include-fixed"
ignoring nonexistent directory "/usr/lib/gcc/x86_64-linux-gnu/9/../../../../x86_64-linux-gnu/include"
#include "..." search starts here:
#include <...> search starts here:
 /usr/lib/gcc/x86_64-linux-gnu/9/include
 /usr/local/include
 /usr/include/x86_64-linux-gnu
 /usr/include
End of search list.
...
COMPILER_PATH=/usr/lib/gcc/x86_64-linux-gnu/9/:/usr/lib/gcc/x86_64-linux-gnu/9/:/usr/lib/gcc/x86_64-linux-gnu/:/usr/lib/gcc/x86_64-linux-gnu/9/:/usr/lib/gcc/x86_64-linux-gnu/
..
LIBRARY_PATH=/usr/lib/gcc/x86_64-linux-gnu/9/:/usr/lib/gcc/x86_64-linux-gnu/9/../../../x86_64-linux-gnu/:/usr/lib/gcc/x86_64-linux-gnu/9/../../../../lib/:/lib/x86_64-linux-gnu/:/lib/../lib/:/usr/lib/x86_64-linux-gnu/:/usr/lib/../lib/:/usr/lib/gcc/x86_64-linux-gnu/9/../../../:/lib/:/usr/lib/
...
```

可以看到gcc的搜索了` /usr/local/include`，但没有搜索`/usr/local/lib`

我们再来看下clang的搜索路径。

```shell
➜  clang -v -g -o tmp tmp.c
```

```shell
# 输出如下
...
ignoring nonexistent directory "/include"
#include "..." search starts here:
#include <...> search starts here:
 /usr/local/include
 /usr/lib/llvm-10/lib/clang/10.0.0/include
 /usr/include/x86_64-linux-gnu
 /usr/include
End of search list.
...
 "/usr/bin/ld" -z relro --hash-style=gnu --build-id --eh-frame-hdr -m elf_x86_64 -dynamic-linker /lib64/ld-linux-x86-64.so.2 -o tmp /usr/bin/../lib/gcc/x86_64-linux-gnu/9/../../../x86_64-linux-gnu/crt1.o /usr/bin/../lib/gcc/x86_64-linux-gnu/9/../../../x86_64-linux-gnu/crti.o /usr/bin/../lib/gcc/x86_64-linux-gnu/9/crtbegin.o -L/usr/bin/../lib/gcc/x86_64-linux-gnu/9 -L/usr/bin/../lib/gcc/x86_64-linux-gnu/9/../../../x86_64-linux-gnu -L/lib/x86_64-linux-gnu -L/lib/../lib64 -L/usr/lib/x86_64-linux-gnu -L/usr/bin/../lib/gcc/x86_64-linux-gnu/9/../../.. -L/usr/lib/llvm-10/bin/../lib -L/lib -L/usr/lib /tmp/tmp-c6d764.o -lgcc --as-needed -lgcc_s --no-as-needed -lc -lgcc --as-needed -lgcc_s --no-as-needed /usr/bin/../lib/gcc/x86_64-linux-gnu/9/crtend.o /usr/bin/../lib/gcc/x86_64-linux-gnu/9/../../../x86_64-linux-gnu/crtn.o
...
```

可以看到clang的搜索路径同样包含`/usr/local/include`。clang对所有的库路径加上了-L参数，这样也行。同样没有搜索`/usr/local/lib`。

这个搜索路径是一个参考。因为我发现clang编译的时候，会出现没有搜索`/usr/include/x86_64-linux-gnu`的情况。

<br>

## 安装clang

前段时间我恰好了解过，可以参考：[clang&llvm简介](https://blog.csdn.net/sinat_38816924/article/details/114673548)

```shell
sudo apt install clang
```

<br>

# bpf程序源码准备

BPF VM能够运行指令以响应内核触发的事件。 但是，并非所有BPF程序都可以访问由内核触发的所有事件。 将程序加载到BPF VM时，需要确定正在运行的程序类型。 这将通知内核有关您的程序将在何处触发的信息。 它还告诉BPF验证程序程序中将允许哪些帮助程序。 选择程序类型后，您还需要选择程序的接口。 该接口确保您可以访问适当类型的数据，以及您的程序是否可以直接访问网络数据包。

这里，我们向您展示如何编写您的第一个BPF程序。 本章还将介绍BPF验证程序在运行程序中所扮演的角色。 此组件可验证您的代码可以安全执行，并帮助您编写不会导致意外结果（例如内存耗尽或内核突然崩溃）的程序。 但是，让我们从头开始编写您自己的BPF程序的基础知识开始。

编写BPF程序的最常见方法是使用LLVM编译的C子集。  LLVM是一种通用编译器，可以发出不同类型的字节码。 在这种情况下，LLVM将输出BPF汇编代码，我们稍后将其加载到内核中。 本书中不会向您介绍很多BPF程序集。 经过长时间的讨论，我们决定最好向您展示在特定情况下如何使用它的示例，但是您可以在网上或BPF手册页中轻松找到一些参考。 在以后的章节中，我们确实会演示BPF汇编的简短示例，其中编写汇编比C更合适，例如Seccomp过滤器可控制内核中的传入系统调用。 我们将在第8章中进一步讨论Seccomp。

内核提供syscall bpf，以便在编译程序后将程序加载到BPF VM中。 该系统调用除了用于加载程序外，还用于其他操作，您将在后面的章节中看到更多用法示例。 内核还提供了一些utilities，可以抽象BPF程序的加载。 在第一个代码示例中，我们使用这些帮助程序向您展示BPF的“ Hello World”示例：

<br>

## 被加载的bpf源码

```c
// 保存在hello_kern.c中

#include <linux/bpf.h>
#define SEC(NAME) __attribute__((section(NAME),used))

static int (*bpf_trace_printk)(const char *fmt, int fmt_size,
                               ...) = (void *)BPF_FUNC_trace_printk;
                               
SEC("tracepoint/syscalls/sys_enter_execve")
int bpf_prog(void *ctx){
    char msg[] = "Hello, BPF World";
    bpf_trace_printk(msg,sizeof(msg));
    return 0;
}

char _license[] SEC("license") = "GPL";
```

[我到`BPF_FUNC_trace_printk`中简单的看了一眼，没明白，暂时跳过。]

上面代码使用attribute，告之BPF VM：当一个tracepoint在execve系统调用中被检测到的时候，调用该bpf程序。

tracepoints是内核二进制代码的静态标记，我们将会在第四章详细讨论tracepoints。现在我们只需要知道，execve是一种[一个程序]执行其他程序的机制。 因此，每次内核检测到某个程序执行另一个程序时，我们将看到消息“Hello, BPF World!”。

在此示例的末尾，我们还指定了该程序的许可证。 由于Linux内核是根据GPL许可的，因此它也只能加载以GPL许可的程序。 如果我们将许可证设置为其他权限，内核将拒绝加载程序。 我们正在使用bpf_trace_printk在内核跟踪日志中打印一条消息； 您可以在/sys/kernel/debug/tracing/trace_pipe中找到此日志。

<br>

### C中的\_\_attribute\_\_

目前，这只是一个hello world程序，不了解`bpf_trace_printk`也没关系，我们可以通过后面章节知道。

但是`attribute`是C语言的内容，作为语法部分，还是可以基本查看明白的。

下面我们重点来看下这几行代码。

```shell
#define SEC(NAME) __attribute__((section(NAME),used))
SEC("tracepoint/syscalls/sys_enter_execve")
char _license[] SEC("license") = "GPL";
```

__attribute__值得细细说下：[指定变量的属性](https://gcc.gnu.org/onlinedocs/gcc-3.2/gcc/Variable-Attributes.html)、[指定函数的属性](https://gcc.gnu.org/onlinedocs/gcc/Function-Attributes.html)、[常见的函数属性](https://gcc.gnu.org/onlinedocs/gcc/Common-Function-Attributes.html#Common-Function-Attributes)、[属性语法](https://gcc.gnu.org/onlinedocs/gcc/Attribute-Syntax.html#Attribute-Syntax)

section：通常，编译器将其生成的代码放在text section中。 但是，有时您需要additional sections，或者需要某些特殊函数出现在特殊sections中。 section属性指定函数存在于特定sections中。

used：This attribute, attached to a function, means that code must be emitted for the function even if it appears that the function is not referenced. This is useful, for example, when the function is referenced only in inline assembly.When applied to a member function of a C++ class template, the attribute also means that the function is instantiated if the class itself is instantiated.[不懂。暂时理解为必须被使用到]

<br>

## 加载程序源码

```c
// 保存在hello_user.c中

#include <stdio.h>
#include "bpf_load.h"

int main(int argc, char **argv){
    if(load_bpf_file("hello_kern.o")!=0){
        printf("The kernel didn't load the BPF program\n");
        return -1;
    }
    read_trace_pipe();

    return 0;
}
```

这里的`read_trace_pipe`读取之前的`bpf_trace_printk`。

`load_bpf_file`和`read_trace_pipe`，声明在"bpf_load.h"，实现在bpf_load.c中。

这两个文件都在sample/bpf中。不知道为啥，没有其合并到libbpf中。我们后面编译的时候，需要指出这两个文件的位置。

<br>

# bpf程序编译

编译方式包含第一类，第二类，尝试第三类。

## 第一类编译方式

第一类：将自行编写的程序放在内核源码中的合适位置，借用linux kernel中的编译方式进行编译，可以参考[编译运行Linux内核源码中的eBPF示例代码](https://cloudnative.to/blog/compile-bpf-examples/)。

因为我的代码没有写在sample/bpf目录下，所以我需要将代码“拷贝”到sample/bpf目录下。但是使用copy命令有个缺点：我在当前目录的代码修改，无法自动同步到sample/bpf目录中。所以，我选择使用硬链接的方式。这样可以做到一份代码，从两处打开。及时打开的权限不同也没关系。我真是机智的一批，哈哈。关于硬链接可以参考：[从文件系统的角度区分硬链接与软连接](https://blog.csdn.net/sinat_38816924/article/details/103464069)

```shell
➜  sudo ln hello_user.c /usr/src/linux-source-5.4.0/linux-source-5.4.0/samples/bpf/hello_user.c 
➜  sudo ln hello_kern.c /usr/src/linux-source-5.4.0/linux-source-5.4.0/samples/bpf/hello_kern.c
```

接下来，利用Linux内核环境来编译自己的BPF程序。只要对`samples/bpf/`目录下的[`Makefile`](https://elixir.bootlin.com/linux/v4.15/source/samples/bpf/Makefile)进行一点点自定义改造即可。因为我没有阅读[Kernel Build System](https://www.kernel.org/doc/html/latest/kbuild/index.html)，所以参考了[分析samples/bpf/Makefile文件](https://cloudnative.to/blog/compile-bpf-examples/#%E5%88%86%E6%9E%90samplesbpfmakefile%E6%96%87%E4%BB%B6)。因为我不是特别清楚，所以这里不展开介绍。修改如下：

```shell
hostprogs-y += hello
hello-objs := bpf_kern.o hello_user.o
always += hello_kern.o
```

接下来，我们在sample/bpf目录中，执行hello程序，可以看到如下输出。

```shell
➜  sudo ./hello
           <...>-122088  [001] .... 86569.066162: 0: Hello, BPF World
           <...>-122090  [002] .... 86569.079831: 0: Hello, BPF World
           <...>-122092  [001] .... 86569.090658: 0: Hello, BPF World
```

因为本机在后台执行execve，所以有上面的输出。使用ctrl+c结束程序，不再打印消息。因为此时该BPF程序从VM中卸载。在接下来的章节中，我们将探讨如何使BPF程序持久化，即使在它们的加载程序终止之后。这样BPF可以在后台运行，收集系统运行数据。

<br>

## 第二类编译方式

第二类：自己编写编译过程，使用编译参数以指向内核库文件和头文件位置，可以参考[运行第一个 bpf 程序](https://blog.csdn.net/Longyu_wlz/article/details/109900096)

本书给的样例代码采用这样的方式：[样例代码](https://github.com/DavadDi/bpf_study)

如果按照书中的方式编译，需要自行安装libbpf。我做了修改，如下所示：

```makefile
CLANG = clang
KERNEL_SRC_PATH = /usr/src/linux-source-5.4.0/linux-source-5.4.0

BPFCODE = hello_kern
LOADER = hello_user

#### BPFCODE编译参数
BPFINCLUDE += -I/usr/include/x86_64-linux-gnu
BPFCFLAGS += -v -O2 -target bpf -c 

#### LOADER编译参数。
# 好奇，bpf_load.c为什么不合并到
LOADER_TOOLS_HEADER = -I$(KERNEL_SRC_PATH)/samples/bpf
LOADER_TOOLS_SRC = $(KERNEL_SRC_PATH)/samples/bpf/bpf_load.c

# LIBRARY_INCLUDE += -I$(KERNEL_SRC_PATH)/samples/bpf
LIBRARY_INCLUDE += -I$(KERNEL_SRC_PATH)/tools/lib
LIBRARY_INCLUDE += -I$(KERNEL_SRC_PATH)/tools/perf
LIBRARY_INCLUDE+= -I$(KERNEL_SRC_PATH)/tools/include

LOADER_LDDIR += -L$(KERNEL_SRC_PATH)/tools/lib/bpf
# LOADER_LDDIR += -L/usr/local/lib64 
LOADER_LDLIBS += -lbpf -lelf

LOADERCFLAGS += -v
LOADERCFLAGS += $(shell grep -q "define HAVE_ATTR_TEST 1" $(KERNEL_SRC_PATH)/tools/perf/perf-sys.h \
                  && echo "-DHAVE_ATTR_TEST=0")

all:build bpfload

#### 编译bpf程序
# 使用<linux/bpf.h>头文件在标准位置，不需要考虑
build:$(BPFCODE.c)
	$(CLANG) $(BPFCFLAGS) $(BPFINCLUDE) $(addsuffix .c, $(BPFCODE)) -o $(addsuffix .o, $(BPFCODE))

#### 编译加载程序
# 放一个build依赖在这里。bpf编译失败，对应的加载程序编译成功也没啥作用
bpfload: build 
	$(CLANG) $(LOADERCFLAGS) $(LOADER_TOOLS_HEADER) $(LIBRARY_INCLUDE) $(LOADER_LDDIR) $(LOADER_LDLIBS) -o $(LOADER) \
		$(LOADER_TOOLS_SRC) $(addsuffix .c, $(LOADER))

clean:
	-rm -rf *.o $(LOADER)

.PHONY: all build bpfload
```

结构很清晰：编译bpf程序参数 + 编译加载程序参数 + 编译bpf程序 + 编译加载程序

其中可以看到，我特地使用两个变量`$(LOADERCFLAGS)` 、`$(LOADER_TOOLS_HEADER)` 来指定`bpf_load.h`和`bpf_load.c`

上面这个很短的Makefile我大概修改了5个小时。。。。。。。

<br>

## 第三类编译方式

第三类：即，将需要的库文件和头文件安装在系统的合适位置。这样可以像调用本地库函数的方式，调用这些需要的内核工具函数。当然这种方式存在一个缺点。缺点在于库和头文件的将来可能需要手动更新。

下面仅仅安装了库，没有安装对应的头文件。因为我暂时对linux kernel的编译过程和内核tools的编译安装方式不了解，所以解决不了第三类。

首先我们需要明白[库](https://blog.csdn.net/sinat_38816924/article/details/108326511)。其次我们需要明白库的版本控制，可以参考[libtool介绍](https://blog.csdn.net/sinat_38816924/article/details/115352247#t11)的第五小点。

这篇文章给出了手动安装和升级动态库的样例：[Upgrading Software](https://docstore.mik.ua/orelly/linux/run/ch07_02.htm)

但是，我并不推荐手动方式安装和升级动态库。因为手动建立软连接以进行库的版本控制，麻烦且容易出错。【ps：我也没试过，哈哈】

如果源码提供了make install的方式安装动态库，使用这样自动的方式安装。没有的话，再考虑手动方式安装。

我在[运行第一个 bpf 程序](https://blog.csdn.net/Longyu_wlz/article/details/109900096#t5)中看到了libbpf的编译过程。照葫芦画瓢，这里安装下libbpf库。至于linux kernel tools中的程序|库|头文件如何安装，我暂时还不知道。

```shell
# sample/bpf/README.rst中，已经说明了libbpf位于tool/lib/bpf目录
# 进入linux内核源码的tool/lib/bpf目录
➜  sudo make 
➜  sudo make install

# 此时安装的内容在/usr/local/lib64中。
# 由于这个目录是新创建的。如果希望这个库以后被自动搜索到，而不是编译的时候手动-L指定，我们需要设置下/etc/ld.so.conf文件
➜  cat /etc/ld.so.conf
include /etc/ld.so.conf.d/*.conf

➜  cd /etc/ld.so.conf.d/
➜  ls
fakeroot-x86_64-linux-gnu.conf  x86_64-linux-gnu.conf
libc.conf                       zz_i386-biarch-compat.conf

➜  cat libc.conf 
# libc default configuration
/usr/local/lib
➜  cat fakeroot-x86_64-linux-gnu.conf 
/usr/lib/x86_64-linux-gnu/libfakeroot
➜  cat x86_64-linux-gnu.conf         
# Multiarch support
/usr/local/lib/x86_64-linux-gnu
/lib/x86_64-linux-gnu
/usr/lib/x86_64-linux-gnu
➜  cat zz_i386-biarch-compat.conf 
# Legacy biarch compatibility support
/lib32
/usr/lib32

所以我们在libc.conf 中添加一行:/usr/local/lib64

# 运行 sudo ldconfig 重新生成动态库配置信息
sudo ldconfig
```

这样便把库安装上了。

<br>

# 附录

## 报错处理

如果你和我一样头铁，喜欢修改成自己的Makefile进行编译。你可能会遇到这个问题。

```shell
/usr/include/linux/types.h:5:10: fatal error: 'asm/types.h' file not found
```

可以看上面，我的Makefile中，添加了这一行。

```makefile
BPFINCLUDE += -I/usr/include/x86_64-linux-gnu
```

你肯定会问，为什么这样修改？`asm`、`asm-generic`、`x86_64-linux-gnu/asm`这三个是什么鬼东西。

我也不知道。但是参考[ubuntu获取源码方式](https://blog.csdn.net/sinat_38816924/article/details/115498707#t9)，或许你会有所启发。

