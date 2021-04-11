[toc]

# 前言

**来源**：[Linux Observability with BPF](https://www.oreilly.com/library/view/linux-observability-with/9781492050193/)

这里搬运下该书第三章：BPF Maps

建议先阅读该blog：[BPF数据传递的桥梁——BPF MAP（一）](https://davidlovezoe.club/wordpress/archives/1044)

<br>

# BPF maps介绍

消息传递来唤醒程序的行为，在软件工程中很常见。一个程序可以通过发送消息来修改另一个程序的行为；这也允许这些程序之间交换信息。关于BPF最吸引人的一个方面是，运行在内核上的代码和加载所述代码的用户空间程序可以在运行时使用消息传递相互通信。[BPF maps用来实现此功能。]

BPF maps是驻留在内核中的键/值存储。任何知道它们的BPF程序都可以访问它们。在用户空间中运行的程序也可以使用文件描述符访问这些映射。只要事先正确指定数据大小，就可以在maps中存储任何类型的数据。

<br>

# BPF maps的相关操作

<br>

## 使用BPF系统调用操作BPF maps

[bpf系统调用](https://man7.org/linux/man-pages/man2/bpf.2.html)执行一系列与扩展的Berkeley包过滤器相关的操作。扩展BPF（或eBPF）类似于用于过滤网络包的("classic") BPF (cBPF)。对于cBPF和eBPF程序，内核都会在加载程序之前对它们进行静态分析，以确保它们不会损害正在运行的系统。eBPF以多种方式扩展cBPF，包括调用一组固定的内核内帮助函数（通过eBPF提供的BPF_CALL操作码扩展）和访问共享数据结构（如eBPF maps）的能力。

bpf系统调用的原型如下：

> #include <linux/bpf.h>
> int bpf(int cmd, union bpf_attr *attr, unsigned int size);

bpf系统调用要执行的操作由cmd参数确定。**每个操作都有一个附带的参数**，通过attr提供。size参数是attr的大小。

1. cmd参数可以是BPF_MAP_CREATE、 BPF_MAP_LOOKUP_ELEM、BPF_MAP_UPDATE_ELEM、BPF_MAP_DELETE_ELEM、BPF_MAP_GET_NEXT_KEY、BPF_PROG_LOAD。分别是map创建、map中元素查找、map中更新元素、map中删除元素、获取相邻的key、加载bpf程序。

2. attr参数结构比较复杂。

   ```c
   // 由于这个结构比较长，我仅仅粘贴前两个结构
   union bpf_attr {
   	struct { /* anonymous struct used by BPF_MAP_CREATE command */
   		__u32	map_type;	/* one of enum bpf_map_type */
   		__u32	key_size;	/* size of key in bytes */
   		__u32	value_size;	/* size of value in bytes */
   		__u32	max_entries;	/* max number of entries in a map */
   		__u32	map_flags;	/* BPF_MAP_CREATE related
   					 * flags defined above.
   					 */
   		__u32	inner_map_fd;	/* fd pointing to the inner map */
   		__u32	numa_node;	/* numa node (effective only if
   					 * BPF_F_NUMA_NODE is set).
   					 */
   		char	map_name[BPF_OBJ_NAME_LEN];
   		__u32	map_ifindex;	/* ifindex of netdev to create on */
   		__u32	btf_fd;		/* fd pointing to a BTF type data */
   		__u32	btf_key_type_id;	/* BTF type_id of the key */
   		__u32	btf_value_type_id;	/* BTF type_id of the value */
   	};
   
   struct { /* anonymous struct used by BPF_MAP_*_ELEM commands */
   		__u32		map_fd;
   		__aligned_u64	key;
   		union {
   			__aligned_u64 value;
   			__aligned_u64 next_key;
   		};
   		__u64		flags;
   	};
   ...
   }
   ```

这里使用bpf系统调用创建map进行演示。例如创建一个 hash-table map。其中key和value都是无符号整形。

```c
union bpf_attr my_map {
    .map_type = BPF_MAP_TYPE_HASH,
    .key_size = sizeof(int),
    .value_size = sizeof(int),
    .max_entries = 100,
    .map_flags = BPF_F_NO_PREALLOC,
};
int fd = bpf(BPF_MAP_CREATE, &my_map, sizeof(my_map));
```

内核包含几个约定(Conventions)来生成BPF映射，包含几个帮助程序来使用BPF映射。您可能会发现，这些约定比直接的系统调用执行更频繁地出现，因为它们更易于阅读和遵循。请记住，这些约定仍然使用bpf syscall来创建映射。因而，后面仅仅介绍这些约定和帮助函数，不再直接使用bpf系统调用。

<br>

## 创建BPF maps

helper函数bpf_map_create包装了刚才看到的代码，以便更容易根据需要初始化映射。我们可以使用它创建上一个map，只需一行代码：

```c
int fd;
fd = bpf_create_map(BPF_MAP_TYPE_HASH, sizeof(int), sizeof(int), 100,BPF_F_NO_PREALOC);
```

如果是将要加载到内核的代码，也可以如下这样创建map。创建原理是：bpf_load.c扫描目标文件时候，解析到maps section，会通过bpf syscall 创建maps。

```c
struct bpf_map_def SEC("maps") my_map = {
    .type = BPF_MAP_TYPE_HASH,
    .key_size = sizeof(int),
    .value_size = sizeof(int),
    .max_entries = 100,
    .map_flags = BPF_F_NO_PREALLOC,
};
```

<font color=red>不知道我的理解对不对。创建maps是用户空间的工作。而map的增删改查，既可以在用户空间，也可以在内核空间。所以这里分开介绍。</font>

<br>

## Working with BFP Maps

内核和用户空间之间的通信将是您编写的每个BPF程序的一个基本部分。<font color=blue>给内核编写代码时访问map的api与给用户空间程序编写代码不同</font>。对于bpf_map_update_elem这个程序：运行在内核的代码从bpf_helpers.h加载；运行在用户空间的代码从tools/lib/bpf/bpf.h加载；这样区分的原因是，内核空间可以直接访问maps；而用户空间访问maps需要通过文件描述符。在内核上运行，可以在原子方式更新元素。在用户空间运行的代码，内核需要复制值以用于更新map。这个非原子操作，可能失败。如果失败，失败原因填充到全局变量errno中。

对于5.4内核源码bpf_helpers.h的位置如下：

```shell
➜  find . -name "bpf_helpers.h"
tools/testing/selftests/bpf/bpf_helpers.h
```

<br>

### 更新元素

我们先看从内核中更新map的函数。

```c
// tools/testing/selftests/bpf/bpf_helpers.h
static int (*bpf_map_update_elem)(void *map, const void *key, const void *value,
				  unsigned long long flags) =
	(void *) BPF_FUNC_map_update_elem;
//#define BPF_FUNC_map_update_elem 2
```

内核中出现这些奇奇怪怪的数字很正常。我暂时不知道这个2是什么鬼。

内核中的bpf_map_update_elem函数有四个参数。第一个是指向我们已经定义的map的指针。第二个是指向要更新的键的指针。因为内核不知道我们要更新的键的类型，所以这个方法被定义为指向void的不透明指针，这意味着我们可以传递任何数据。第三个参数是我们要插入的值。此参数使用与键参数相同的语义。我们在本书中展示了一些如何利用不透明指针的高级示例。您可以使用此函数中的第四个参数来更改map的更新方式。此参数可以采用三个值：
* 如果传递0，则告诉内核如果元素存在，则要更新该元素；如果元素不存在，则要在映射中创建该元素。[0可以用BPF_ANY宏表示]
* 如果传递1，则告诉内核仅在元素不存在时创建该元素。[1可以用BPF_NOEXIST宏表示]
* 如果传递2，内核将只在元素存在时更新它。[2可以用BPF_EXIST宏表示]

也可以从用户空间程序中更新map。执行此操作的帮助程序与我们刚才看到的类似；唯一的区别是，它们使用文件描述符访问map，而不是直接使用指向map的指针。正如您所记得的，用户空间程序总是使用文件描述符访问map。

```c
// tools/lib/bpf/bpf.h
#ifndef LIBBPF_API
#define LIBBPF_API __attribute__((visibility("default")))
#endif
LIBBPF_API int bpf_map_update_elem(int fd, const void *key, const void *value,
				   __u64 flags);
```

这里的fd获取方式有两种。第一中，是使用`bpf_create_map`函数返回的fd。也可以通过全局变量map_fd访问。

至于怎么访问之类的细节，后面代码实战的时候涉及，这里暂时跳过。

<br>

### 读取元素

`bpf_map_lookup_elem`：从map中读取内容。同样，也分为内核空间和用户空间两种形式。

```c
// 内核空间
// tools/testing/selftests/bpf/bpf_helpers.h
static void *(*bpf_map_lookup_elem)(void *map, const void *key) =
	(void *) BPF_FUNC_map_lookup_elem;
//#define BPF_FUNC_map_lookup_elem 1
```

```c
// 用户空间
// tools/lib/bpf/bpf.h
#ifndef LIBBPF_API
#define LIBBPF_API __attribute__((visibility("default")))
#endif
LIBBPF_API int bpf_map_lookup_elem(int fd, const void *key, void *value);
```

它们的第一个参数也有所不同；内核方法引用映射，而用户空间帮助程序将映射的文件描述符标识符作为其第一个参数。第三个参数是指向代码中要存储从映射中读取的值的变量的指针。

<br>

### 删除元素

同样有两种：运行在用户空间，运行在内核空间。如果删除的key不存在，返回一个负数；error被设置成ENOENT。

```c
static int (*bpf_map_delete_elem)(void *map, const void *key) =
	(void *) BPF_FUNC_map_delete_elem;
```

```c
LIBBPF_API int bpf_map_delete_elem(int fd, const void *key);
```

<br>

### 迭代遍历元素

` bpf_map_get_next_key`，此指令仅适用于在用户空间上运行的程序。

```c
LIBBPF_API int bpf_map_get_next_key(int fd, const void *key, void *next_key);
```

第一个参数：map的文件描述符。第二个参数：lookup_key，你希望查找的属性值对应的key。第三个参数：next_key，map中的next key。

当您调用这个帮助程序时，BPF会尝试在这个map中找到作为查找键传递的键的元素；然后，它会用映射中相邻的键设置下一个next_key参数。因此，如果您想知道哪个键在键1之后，您需要将1设置为lookup_key，BPF会将与之相邻的key设置为下一个next_key参数的值。

如果要打印映射中的所有值，可以使用bpf_map_get_next_key键和映射中不存在的查找键。这将强制BPF从地图的开头开始。

当bpf_map_get_next_key到达map的末尾时候，返回一个负数，errno值被设置成ENOENT。

您可以想象，bpf_map_get_next_key可以从地图中的任何一点开始查找key；如果您只希望另一个特定key的下一个key，则不需要从map的开头开始。

另外，我们还需要知道 bpf_map_get_next_key的另一个行为。许多编程语言会在迭代遍历之前，复制map。因为遍历的时候，如果有代码删除将要遍历的元素，将会很危险[C++似乎是这么做的]。`bpf_map_get_next_key`遍历的时候，没有复制map。如果遍历的时候，map中存在元素被删除，bpf_map_get_next_key会自动跳过它。

<br>

### 查找删除元素

`bpf_map_lookup_and_delete_elem. `:一个元素通过key进行搜索。搜索到之后，删除这个元素，同时将元素的值放在value中。这个也是仅仅适用于用户空间。

```c
LIBBPF_API int bpf_map_lookup_and_delete_elem(int fd, const void *key,void *value);
```

<br>

### 并发访问map

使用BPF映射的挑战之一是许多程序可以同时访问相同的映射。这会在我们的BPF程序中引入竞争条件。为了防止竞争情况，BPF引入了BPF自旋锁的概念，它允许您在对map元素进行操作时锁定对map元素的访问。自旋锁仅适用于array、hash和cgroup存maps。

```c
// 信号量
// /usr/include/linux
struct bpf_spin_lock {
	__u32	val;
};

// 内核
// 加锁+解锁
// tools/testing/selftests/bpf/bpf_helpers.h
static void (*bpf_spin_lock)(struct bpf_spin_lock *lock) =
	(void *) BPF_FUNC_spin_lock;
static void (*bpf_spin_unlock)(struct bpf_spin_lock *lock) =
	(void *) BPF_FUNC_spin_unlock;
```

我这里复制下书上的事例。这个访问控制，精度比较细。对每一个元素使用了自旋锁。另外这个map必须用BPF类型格式(BPF Type Format,BTF)注释，这样verifier就知道如何解释这个结构。类型格式通过向二进制对象添加调试信息，使内核和其他工具对BPF数据结构有了更丰富的理解。

```c
struct concurrent_element {
    struct bpf_spin_lock semaphore;
    int count;
}

struct bpf_map_def SEC("maps") concurrent_map = {
    .type = BPF_MAP_TYPE_HASH,
    .key_size = sizeof(int),
    .value_size = sizeof(struct concurrent_element),
    .max_entries = 100,
};

BPF_ANNOTATE_KV_PAIR(concurrent_map, int, struct concurrent_element);

int bpf_program(struct pt_regs *ctx) {
	int key = 0;
    struct concurrent_element init_value = {};
    struct concurrent_element *read_value;
    bpf_map_create_elem(&concurrent_map, &key, &init_value, BPF_NOEXIST);
    read_value = bpf_map_lookup_elem(&concurrent_map, &key);
    bpf_spin_lock(&read_value->semaphore);
    read_value->count += 100;
    bpf_spin_unlock(&read_value->semaphore);
}
```

用户空间更改map的话，使用bpf_map_update_elem和bpf_map_lookup_elem_flags的时候，添加 BPF_F_LOCK flags。

<br>

# maps的类型

上一节介绍的是map的增删改查等操作。这一节介绍，创建map的时候，需要指定map的类型(bpf_attr需要)可以有哪些。

[Linux文档](https://man7.org/linux/man-pages/man2/bpf.2.html)将map定义为通用数据结构，您可以在其中存储不同类型的数据。多年来，内核开发人员添加了许多在特定用例中更有效的专用数据结构。本节探讨每种类型的map以及如何使用它们。

* BPF_MAP_TYPE_HASH：第一个添加到BPF的通用 map。它们的实现和用法类似于您可能熟悉的其他哈希表。
* BPF_MAP_TYPE_ARRAY：添加到内核的第二种BPF映射。它的所有元素都在内存中预先分配并设置为零值。键是数组中的索引，它们的大小必须正好是4个字节。使用Array maps的一个缺点是不能删除map中的元素。如果尝试在array maps上使用map_delete_elem，则调用将失败，结果将导致错误EINVAL。
*  BPF_MAP_TYPE_PROG_ARRAY：您可以使用这种类型的map,来存储BPF程序的文件描述。与 bpf_tail_call调用结合，此map允许您在程序之间跳转，绕过单个bpf程序的最大指令限制，并降低实现复杂性。
*  BPF_MAP_TYPE_PERF_EVENT_ARRAY：这些类型的map将perf_events数据存储在缓冲环中，缓冲环在BPF程序和用户空间程序之间实时通信。它们被设计用来将内核的跟踪工具发出的事件转发给用户空间程序进行进一步处理。
* BPF_MAP_TYPE_PERCPU_HASH：Per-CPU Hash Maps是 BPF_MAP_TYPE_HASH的改进版本。当您分配其中一个map时，每个CPU都会看到自己独立的map版本，这使得它更高效地进行高性能的查找和聚合。如果您的BPF程序收集度量并将它们聚合到 hash-table maps中，那么这种map非常有用。
* BPF_MAP_TYPE_PERCPU_ARRAY：Per-CPU Array Maps是BPF_MAP_TYPE_ARRAY的改进版本。当您分配这些map中的一个时，每个CPU都会看到自己的独立版本的map，这使得它更高效地进行高性能的查找和聚合。
*  BPF_MAP_TYPE_STACK_TRACE：这种类型的map存储运行进程的堆栈跟踪。除了这个map之外，内核开发人员已经添加了帮助函数bpf_get_stackid来帮助您用堆栈跟踪填充这个映射。
* BPF_MAP_TYPE_CGROUP_ARRAY：这种类型的map存储指向cgroup的文件描述符标识符。
* BPF_MAP_TYPE_LRU_HASH and BPF_MAP_TYPE_LRU_PERCPU_HASH：如果map满了，删除不常使用的map，为新元素提供空间。percpu则是针对每个cpu。
* BPF_MAP_TYPE_LPM_TRIE：一个匹配最长前缀的字典树数据结构，适用于将IP地址匹配到一个范围。这些map要求其key大小为8的倍数，范围为8到2048。如果您不想实现自己的key，那么内核提供了一个可以用于这些key的结构，称为bpf_lpm_trie_key。
* BPF_MAP_TYPE_ARRAY_OF_MAPS and BPF_MAP_TYPE_HASH_OF_MAPS：存储对其他映射的引用的两种类型的映射。它们只支持一个级别的间接寻址。
* BPF_MAP_TYPE_DEVMAP：存储对网络设备的引用。可以构建指向特定网络设备的端口的虚拟映射，然后使用 bpf_redirect_map重定向数据包。
* BPF_MAP_TYPE_CPUMAP：可以将数据包转发到不同的cpu
* BPF_MAP_TYPE_XSKMAP：一种存储对打开的套接字的引用的映射类型。用于套接字转发。
* BPF_MAP_TYPE_SOCKMAP和BPF_MAP_TYPE_SOCKHASH 是两个专门的map。它们存储对内核中打开的套接字的引用。与前面的映射一样，这种类型的映射与 bpf_redirect_map一起使用，将套接字缓冲区从当前XDP程序转发到不同的套接字。
* BPF_MAP_TYPE_CGROUP_STORAGE 和 BPF_MAP_TYPE_PERCPU_CGROUP_STORAGE：略
*  PF_MAP_TYPE_REUSEPORT_SOCKARRAY：略
* BPF_MAP_TYPE_QUEUE：队列映射使用先进先出（FIFO）存储来保存映射中的元素。它们是用 BPF_MAP_TYPE_QUEUE类型定义的。FIFO意味着，当您从映射中获取一个元素时，结果将是映射中存在时间最长的元素。
* BPF_MAP_TYPE_STACK：栈映射使用后进先出（LIFO）存储来保存映射中的元素。它们是用类型BPF_MAP_TYPE_STACK定义的。后进先出意味着，当您从映射中获取元素时，结果将是最近添加到映射中的元素。

<br>

# BPF程序类型

这个本来在第二章。因为这里聚集的都是概念，所以把BPF的程序类型也放在这里。

1. BPF_PROG_TYPE_SOCKET_FILTER ：BPF_PROG_TYPE_SOCKET_FILTER是第一个添加到Linux内核的程序类型。将BPF程序附加到原始套接字时，可以访问该套接字处理的所有数据包。Socket Filter Programs不允许您修改这些数据包的内容或更改这些数据包的目的地；它们只允许您出于可观察的目的访问这些数据包。程序接收的元数据包含与网络堆栈相关的信息，例如用于传递数据包的协议类型。我们将在第6章详细介绍套接字过滤和其他网络程序。
2. BPF_PROG_TYPE_KPROBE：正如您将在第4章中看到的，我们在其中讨论跟踪，kprobes是可以动态附加到内核中某些调用点的函数。BPF kprobe程序类型允许您将BPF程序用作kprobe处理程序。它们用BPF_PROG_TYPE_KPROBE类型定义的。BPF VM确保kprobe程序始终安全运行，这是传统kprobe模块的一个优势。您仍然需要记住，kprobe在内核中不是稳定的入口点，因此您需要确保kprobe BPF程序与您使用的特定内核版本兼容
3. BPF_PROG_TYPE_TRACEPOINT：这种类型的程序允许您将BPF程序附加到内核提供的跟踪点处理程序。跟踪点程序是用类型BPF_PROG_TYPE_TRACEPOINT定义的。正如您将在第4章中看到的，跟踪点是内核代码库中的静态标记，允许您为跟踪和调试目的注入任意代码。它们不如kprobes灵活，因为它们需要由内核预先定义，但是在内核中引入它们之后，它们保证是稳定的。当您要调试系统时，这将为您提供更高级别的可预测性。系统中的所有跟踪点都在/sys/kernel/debug/trac-ing/events目录中定义。在那里，您将找到每个子系统，其中包含任何跟踪点，并且您可以将BPF程序附加到这些子系统。
4.  BPF_PROG_TYPE_XDP：XDP程序允许您编写在网络数据包到达内核时很早就执行的代码。由于内核本身没有太多时间来处理信息，因此它只公开来自数据包的有限信息集。因为数据包是在早期执行的，所以您对如何处理该数据包有更高级别的控制。XDP程序定义了几个可以控制的操作，这些操作允许您决定如何处理数据包。您可以从XDP程序返回XDP_PASS ，这意味着数据包应该传递到kernel中的下一个子系统。您还可以返回XDP_DROP，这意味着内核应该完全忽略这个数据包，而不做任何其他处理。您还可以返回 XDP_TX，这意味着数据包应该转发回最初接收到数据包的网络接口卡（NIC）。
5. BPF_PROG_TYPE_PERF_EVENT：这些类型的BPF程序允许您将BPF代码附加到Perf事件。Perf是内核中的一个内部探查器，它为硬件和软件发出性能数据事件。你可以用它来监视很多事情，从你的计算机的CPU到你系统上运行的任何软件。当您将BPF程序附加到Perf事件时，每次Perf生成数据供您分析时，您的代码都将被执行。
6. BPF_PROG_TYPE_CGROUP_SKB：这些类型的程序允许您将BPF逻辑附加到控制组（cgroups）。它们允许cgroup在它们包含的进程内控制网络流量。使用这些程序，您可以在将网络数据包传递到cgroup中的进程之前决定如何处理它。内核试图传递给同一cgroup中的任何进程的任何数据包都将通过这些过滤器之一。同时，您可以决定当cgroup中的进程通过该接口发送网络数据包时要做什么。
7. BPF_PROG_TYPE_CGROUP_SOCK：这些类型的程序允许您在cgroup中的任何进程打开网络套接字时执行代码。这种行为类似于连接到cgroup套接字缓冲区的程序，但是它们不允许您在数据包通过网络时访问它们，而是允许您控制进程打开新套接字时发生的事情。它们是用BPF_PROG_TYPE_CGROUP_SOCK类型定义的。这有助于对可以打开套接字的程序组提供安全性和访问控制，而不必单独限制每个进程的功能。
8. BPF_PROG_TYPE_CGROUP_SKB：这些类型的程序允许您在运行时修改套接字连接选项，而数据包在内核的网络堆栈中经过几个阶段。
9. BPF_PROG_TYPE_SK_SKB：程序允许您访问套接字映射和套接字重定向。
10. BPF_PROG_TYPE_CGROUP_DEVICE：这种类型的程序允许您决定是否可以对给定设备执行cgroup中的操作。
11. BPF_PROG_TYPE_SK_MSG：这些类型的程序允许您控制是否应该传递发送到套接字的消息。
12. BPF_PROG_TYPE_RAW_TRACEPOINT、BPF_PROG_TYPE_CGROUP_SOCK_ADDR、BPF_PROG_TYPE_SK_REUSEPORT、BPF_PROG_TYPE_FLOW_DISSECTOR、BPF_PROG_TYPE_SCHED_CLS and BPF_PROG_TYPE_SCHED_ACT、BPF_PROG_TYPE_LWT_IN, BPF_PROG_TYPE_LWT_OUT, BPF_PROG_TYPE_LWT_XMIT and BPF_PROG_TYPE_LWT_SEG6LOCAL 、BPF_PROG_TYPE_LIRC_MODE2：略

<br>

# BPF验证器

同样是第二章的概念，搬运到这里。

verifier执行的第一个检查是对VM将要加载的代码的静态分析。第一次检查的目的是确保程序有一个预期的结束。为此，verifier使用代码创建一个直接非循环图（DAG）。verifier分析的每条指令都成为图中的一个节点，每个节点都链接到下一条指令。在verifier生成这个图之后，它将执行深度优先搜索（DFS），以确保程序完成并且代码不包含危险路径。这意味着它将遍历图的每个分支，一直遍历到分支的底部，以确保没有递归循环。

verifier执行的第二个检查是BPF程序的一个空运行。这意味着verifier将尝试分析程序将要执行的每条指令，以确保它不会执行任何无效的指令。此执行还检查是否正确访问和取消引用了所有内存指针。最后，空运行将程序中的控制流通知verifier，以确保无论程序采用哪种控制路径，它都会到达BPF_EXIT指令。为此，verifier跟踪堆栈中所有已访问的分支路径，在选择新路径之前对其进行评估，以确保不会多次访问特定路径。在这两个检查通过之后，verifier认为程序可以安全地执行。

bpf系统调用允许您debug verifier的检查，如果您对分析程序如何被分析感兴趣的话。使用此系统调用加载程序时，可以设置几个属性，使验证器打印其操作日志。