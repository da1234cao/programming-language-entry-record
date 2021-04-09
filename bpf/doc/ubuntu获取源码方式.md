[toc]

## 前言

在ubuntu中，当我们需要调试glibc的时候，我们需要glibc的源码和glibc的symbols。

在编写bpf程序的时候，需要linux内核源码。

这两者需要源码。而源码的安装方式，网上有好几个版本。以glibc为例：

1) 版本一：`sudo apt install glibc-source`

2) 版本二：`sudo apt source glibc`

3) 版本三：`sudo apt-get source glibc`

我认为，通过尝试来区分它们的不同是最笨最慢的方式。所以我去[Official Ubuntu Documentation](https://help.ubuntu.com/)和[apt install glibc-source and apt source glibc different stackoverflow](https://www.google.com/search?q=apt+install+glibc-source+and+apt+source+glibc+different+stackoverflow&safe=strict&sxsrf=ALeKk02bG9TG4ErIrslj_IkzQhTPEiLMsQ%3A1617780524642&ei=LF9tYMzkJvKgrgS8yb64CQ&oq=apt+install+glibc-source+and+apt+source+glibc+different+stackoverflow&gs_lcp=Cgdnd3Mtd2l6EAM6CggjEK4CELADECc6BwgjELACECc6BAgjECdQo4QBWP-zAWC1zgFoBXAAeACAAaACiAGXFJIBBDItMTCYAQCgAQGqAQdnd3Mtd2l6yAEBwAEB&sclient=gws-wiz&ved=0ahUKEwjMqvuLzuvvAhVykIsKHbykD5cQ4dUDCA0&uact=5)中查找答案，没有找到我想要的。可能是我的搜索方式不对，暂时没有找到我想要的。所以下面，我通过实例自行尝试和推理一番。

<br>

## 准备工作

首先把/etc/apt/sources.list中，相关的deb-src注释去掉，以获取源码源。

```shell
# /etc/apt/sources.list
deb-src http://cn.archive.ubuntu.com/ubuntu/ focal main restricted
deb-src http://cn.archive.ubuntu.com/ubuntu/ focal-updates main restricted
sudo apt update
```

上面含义，具体可以参考[sources.list.5.html](http://manpages.ubuntu.com/manpages/hirsute/man5/sources.list.5.html) + [/etc/apt/sources.list – SourcesList file in Ubuntu distribution](https://techpiezo.com/linux/etc-apt-sources-list-sourceslist-file-in-ubuntu-distribution/)

可以使用`lsb_release -a`查看当前主机版本代号。不同的版本代号如下所示：

* Ubuntu 15.04 代号：vivid；
* Ubuntu 16.04代号：xenial；
* Ubuntu 17.04代号：zesty；
* Ubuntu 18.04代号：bionic；
* Ubuntu 19.04代号：disco
* Ubuntu 20.04代号：focal

对于Ubuntu发行版，我们有四个存储库组件：

* main：免费软件，Canonical正式支持
* universe：免费软件，Canonical不支持
* restricted：Canonical正式支持的非自由软件（主要包括设备驱动程序）
* multiverse：Canonical不支持非自由软件（非插件flashplugin出现在此处）

另外，为了避免下载的内容到处都是，我们在HOME目录下，建立一个tmp目录。

```shell
cd ~
mkdir tmp && cd tmp
```

<br>

## glibc源码下载

下载glibc最简单的方式当然是去官网直接下载代码：[glibc](https://www.gnu.org/software/libc/)。但是这存在两个麻烦的地方：查看主机glibc的版本、打开官网链接。哈哈，这麻烦是我自己编的，其实不麻烦。

### 尝试三种源码下载方式

1. 版本一

   ```shell
   ➜  sudo apt install glibc-source
   ...
   获取:1 http://cn.archive.ubuntu.com/ubuntu focal-updates/universe amd64 glibc-source all 2.31-0ubuntu9.2 [18.2 MB]
   正在选中未选择的软件包 glibc-source。
   (正在读取数据库 ... 系统当前共安装有 229565 个文件和目录。)
   准备解压 .../glibc-source_2.31-0ubuntu9.2_all.deb  ...
   正在解压 glibc-source (2.31-0ubuntu9.2) ...
   正在设置 glibc-source (2.31-0ubuntu9.2) ...
   ...
   ```

   我们会发现，glibc的源码压缩包通过source.list中的源下，并安装在`/usr/src`目录下面，包含压缩包和一个debian目录。debian目录中的文件，用于定制软件包的行为。我不清楚这个debian目录，可以自行阅读：[第 4 章 `debian` 目录中的必需内容](https://www.debian.org/doc/manuals/maint-guide/dreq.zh-cn.html) | [第 5 章 `debian` 目录下的其他文件](https://www.debian.org/doc/manuals/maint-guide/dother.zh-cn.html)

   ```shell
   ➜  tree -L 1
   .
   ├── debian
   └── glibc-2.31.tar.xz
   
   # 需要自行解压
   ➜  sudo tar -xvf glibc-2.31.tar.xz
   ```

   ```shell
   # 如果需要glibc的调试信息，可以如下操作
   sudo apt-get install libc-dbg
   
   # 如果是gdb调试，需要指定源码位置
   settings set target.source-map /lib/x86_64-linux-gnu/libc.so.6 /usr/src/glibc/glibc-2.31
   
   # 我也尝试过通过lldb调试，使用lldb方式指定源码位置之后，提示没有找到源码。
   # 可能是我指定的方式有问题？
   ```

   需要注意的是，使用这种方式安装，不要使用rm进行卸载。[**为什么呢？可以猜猜**]

   ```shell
   # 如果使用rm卸载
   sudo rm -rf glibc 
   # 删除之后，使用dpkg仍然可以查到这个文件，虽然已经没有这个文件了
   dpkg -L glibc-source
   # 此时假如我们希望重装,会提示已安装，但是实际上并没有将glibc-source重新安装
   sudo apt install glibc-source
   
   # 所以我们还是需要手动remove之后，才能重新安装上
   sudo apt remove glibc-source
   sudo apt install glibc-source
   ```

2. 版本二

   ```shell
   ➜  sudo apt source glibc
   ...
   提示：glibc 的打包工作被维护于以下位置的 Git 版本控制系统中
   https://git.launchpad.net/~ubuntu-core-dev/ubuntu/+source/glibc
   请使用：
   git clone https://git.launchpad.net/~ubuntu-core-dev/ubuntu/+source/glibc
   获得该软件包的最近更新(可能尚未正式发布)。
   需要下载 18.2 MB 的源代码包。
   获取:1 http://cn.archive.ubuntu.com/ubuntu focal-updates/main glibc 2.31-0ubuntu9.2 (dsc) [9,561 B]
   获取:2 http://cn.archive.ubuntu.com/ubuntu focal-updates/main glibc 2.31-0ubuntu9.2 (tar) [17.3 MB]
   获取:3 http://cn.archive.ubuntu.com/ubuntu focal-updates/main glibc 2.31-0ubuntu9.2 (diff) [847 kB]
   dpkg-source: info: extracting glibc in glibc-2.31
   dpkg-source: info: unpacking glibc_2.31.orig.tar.xz
   dpkg-source: info: unpacking glibc_2.31-0ubuntu9.2.debian.tar.xz
   dpkg-source: info: using patch list from debian/patches/series
   dpkg-source: info: applying git-updates.diff
   dpkg-source: info: applying locale/check-unknown-symbols.diff
   ...
   dpkg-source: info: applying ubuntu/git-elf-Add-endianness-markup-to-ld.so.cache-bug-27008.patch
   W: 由于文件'glibc_2.31-0ubuntu9.2.dsc'无法被用户'_apt'访问，已脱离沙盒并提权为根用户来进行下载。 - pkgAcquire::Run (13: 权限不够)
   ```

   同样会下载源码到当前目录。但是可以看到获取的时候，没有指定平台类型(amd64)。同时，这里下载的源码似乎是最新的代码，甚至可能没有发布。

   ```tree
   ➜  tree -L 1
   .
   ├── glibc-2.31
   ├── glibc_2.31-0ubuntu9.2.debian.tar.xz
   ├── glibc_2.31-0ubuntu9.2.dsc
   └── glibc_2.31.orig.tar.xz
   ```

   其中glibc_2.31-0ubuntu9.2.debian.tar.xz解压便是版本一中的debian目录。

   所以目前而言，版本二相对与版本一，除了代码更新了之外，便多了一个glibc_2.31-0ubuntu9.2.dsc。该文件里面标注着`PGP SIGNED MESSAGE`。

   这个权限不够的警告，网上有[解决办法](https://www.mobibrw.com/2017/8418)，**但是并没有说明为什么有个这个警告**。另外，既然是警告，暂时跳过就好。

3. 版本三

   ```shell
   sudo apt-get source glibc
   ```

   运行这个命令后，结果和版本二相同。我们有理由相信着两者的作用相同。

   这首先涉及到[apt与apt-get命令的区别](https://www.sysgeek.cn/apt-vs-apt-get/)。通过链接文章，我们知道，目前我们可以抛弃使用apt-get转而使用apt。

   为了确认apt-get和apt中都有source这个选项，我们分别查看下它们的man文档。

   尴尬的是，apt-get中明确给出了source选项的说明。但是，apt中并没有source的说明。但鉴于apt 可以使用source选项，暂时不管这个命令背后是如何操作的，我暂时认为apt包含source这个选项，并起到和apt-get相同的效果。

### 小结

所以目前来说，除了直接从官网下载源码，我们有两种方式都可以下载源码。

1. `sudo apt install glibc-source`：下载源码到系统的合适位置，需要手动解压。
2. `sudo apt source glibc`：下载源码到当前位置，已自动解压，并且该源码是[该版本]最新代码，甚至可能没有发布。

<br>

## linux内核源码下载

最简单的是到[The Linux Kernel Archives](https://www.kernel.org/)直接下载对应版本。

### linux内核头文件

安装内核源码，不需要安装linux-headers。这里是为了和下面的`make headers_install`做对比。

```shell
sudo apt install linux-headers-$(uname -r)
```

linux-headers有什么作用？<font color=red>我不知道</font> 。为linux内核构建modules?

> [linux-headers 5.11.11.arch1-1 **Description**](https://archlinux.org/packages/core/x86_64/linux-headers/)
>
> Headers and scripts for building modules for the Linux kernel

之前我构建过一次简单的moduels，似乎确实是需要内核头文件：[防火墙的介绍实现与分类](https://blog.csdn.net/sinat_38816924/article/details/107649007#t5)

### linux内核源码下载

```shell
# sudo apt install linux-source 与下面作用相同
cd src
sudo apt source linux

# 输出如下
正在读取软件包列表... 完成
提示：linux 的打包工作被维护于以下位置的 Git 版本控制系统中：
git://git.launchpad.net/~ubuntu-kernel/ubuntu/+source/linux/+git/focal
请使用：
git clone git://git.launchpad.net/~ubuntu-kernel/ubuntu/+source/linux/+git/focal
获得该软件包的最近更新(可能尚未正式发布)。
需要下载 178 MB 的源代码包。
获取:1 http://cn.archive.ubuntu.com/ubuntu focal-updates/main linux 5.4.0-70.78 (dsc) [6,875 B]
获取:2 http://cn.archive.ubuntu.com/ubuntu focal-updates/main linux 5.4.0-70.78 (tar) [170 MB]
...
```

上面那种是正确的方式。我们还会看到下面这种内核源码安装方式。可以看到`选择 linux 作为源代码包而非 linux-image-unsigned-5.4.0-70-generic`。所以不推荐。[**至于为什么出现这种情况呢？**]

```shell
# 并没有sudo apt linux-image-unsigned-$(uname -r)-source
sudo apt source linux-image-unsigned-$(uname -r)


# 输出如下
正在读取软件包列表... 完成
选择 linux 作为源代码包而非 linux-image-unsigned-5.4.0-70-generic
提示：linux 的打包工作被维护于以下位置的 Git 版本控制系统中：
git://git.launchpad.net/~ubuntu-kernel/ubuntu/+source/linux/+git/focal
请使用：
git clone git://git.launchpad.net/~ubuntu-kernel/ubuntu/+source/linux/+git/focal
获得该软件包的最近更新(可能尚未正式发布)。
需要下载 178 MB 的源代码包。
获取:1 http://cn.archive.ubuntu.com/ubuntu focal-updates/main linux 5.4.0-70.78 (dsc) [6,875 B]
获取:2 http://cn.archive.ubuntu.com/ubuntu focal-updates/main linux 5.4.0-70.78 (tar) [170 MB]
```

有的地方会看到这种方式下载内核源码。我尝试了下，并没有下载源码。那么自然引出一个问题：`linux-image-unsigned-$(uname -r)`与`linux-image-$(uname -r)`之间的区别？[**我不知道**]

```shell
apt source linux-image-$(uname -r)
```

**linux内核源码也能生成头文件，和上面的linux-headers有什么区别？**

```shell
# 进入linux源码目录
# 我们将头文件生成到上一级目录，放在include目录中
make INSTALL_HDR_PATH="../" headers_install
/usr/src/linux-source-5.4.0/include
➜  tree -L 1
.
├── asm
├── asm-generic
├── drm
├── linux
├── misc
├── mtd
├── rdma
├── scsi
├── sound
├── video
└── xen

11 directories, 0 files
```

[Exporting kernel headers for use by userspace](https://www.kernel.org/doc/html/latest/kbuild/headers_install.html?highlight=headers_install) 

> linux内核导出的头文件描述了尝试使用内核服务的用户空间程序的API。系统的C库（例如glibc或uClibc）使用这些内核头文件来定义可用的系统调用，以及与这些系统调用一起使用的常量和结构。
>
> C库的头文件包含在kernel header files的linux子目录中。系统的libc头文件通常安装在/usr/include中。kernel header files也在/usr/include中，其中比较有名的是 /usr/include/linux 和 /usr/include/asm

所以，这里可以将kernel header files合并到/usr/include中。

```shell
# 备份下，虽然我感觉出了问题，这个备份可能也用不上。。
sudo cp -a  include include.bak

# 进入linux源码目录;但是它在当前目录安装./usr/include
# 这里直接生成内容到/usr/include中
sudo make INSTALL_HDR_PATH="../../../" headers_install

# 查看下有哪些复制过来哪些东西。其实只复制过来一个目录asm
# 这个很重要哦~
diff -r include include.bak

只在 include 存在：asm
```

<br>

### asm头文件

此时我们的/usr/include目录下面有三个asm相关的头文件

* asm：内核源码生成的asm头文件
* asm-generic：系统中原有的头文件
*  x86_64-linux-gnu/asm：系统中原有的头文件

我在网上找了好些地方，想知道它们三者的区别。我找了：[Official Ubuntu Documentation](https://help.ubuntu.com/)、[debian doc](https://www.debian.org/doc/)、[Filesystem Hierarchy Standard](https://www.pathname.com/fhs/)、[The Linux Kernel documentation](https://www.kernel.org/doc/html/latest/index.html)、[LWN.net](https://lwn.net/)、[Using the GNU Compiler Collection](https://gcc.gnu.org/onlinedocs/)。只在FHS中找到点描述。

> [6.1.8. /usr/include : Header files included by C programs](https://www.pathname.com/fhs/pub/fhs-2.3.html#USRINCLUDEHEADERFILESINCLUDEDBYCP)
>
> These symbolic links are required if a C or C++ compiler is installed and only for systems not based on glibc.
> /usr/include/asm -> /usr/src/linux/include/asm-\<arch\>
> /usr/include/linux -> /usr/src/linux/include/linux

1. 我使用了diff对比了，`内核源码生成的asm头文件`和` x86_64-linux-gnu/asm`，发现这两者相同。
2. 所以我猜测：asm-generic是和架构相关的通用代码；asm除了包含通用架构代码之外，包含本机器特殊的架构代码；
3. 所以我猜测：x86_64-linux-gnu放置x86架构的64位的linux和gnu相关的代码，不具有跨平台性的代码。

```shell
➜ uname -a
Linux dacao-Vostro-23-3340 5.4.0-70-generic #78-Ubuntu SMP Fri Mar 19 13:29:52 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
```

<font color=blue>所以，如果系统中报错缺少asm/types.h。可能直接从/usr/include/x86_64-linux-gnu/asm中，建立一个软连接到/usr/include/目录下就好。</font>

<br>

## 参考文章

[Build Your Own Kernel](https://wiki.ubuntu.com/Kernel/BuildYourOwnKernel) -- 很好的文章

[快速搭建一个Linux内核调试环境](https://de4dcr0w.github.io/%E5%BF%AB%E9%80%9F%E6%90%AD%E5%BB%BA%E4%B8%80%E4%B8%AALinux%E5%86%85%E6%A0%B8%E8%B0%83%E8%AF%95%E7%8E%AF%E5%A2%83.html)