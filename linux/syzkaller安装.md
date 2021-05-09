[toc]



## 摘要

安装[syzkaller](https://github.com/google/syzkaller)。运行命令，进行安装，没有什么难度。

**但是阅读构建脚本，我们可以掌握基本的linux内核的构建，文件系统的构建，qemu的使用**。

遗憾的是，我暂时没有阅读syzkaller manager本身的构建过程；没有去运行syzkaller。

目的地重要，路上的skill也重要。一个领域的环境大体有一定的大小，出门便可以遇到之前接触的内容，也是件令人快乐的事情。

<br>

## 内核编译

下载并编译内核。了解内核基本的编译方式，最简单的编译配置。

### GCC 安装

要编译内核，`gcc`不可或缺。

[update-alternatives -- gcc版本切换](https://blog.csdn.net/u011762313/article/details/47324839) | [ar、ranlib、nm命令](https://www.jianshu.com/p/2ec7ee43e3a1)

```
sudo apt install gcc
```

### 查看当前系统(架构)

网上文章很多，我不清楚。

你可能想到的问题：CPU的架构，操作系统与CPU架构之间的关系？

我知道查看当前环境是哪种，下载哪种安装包，仅此而已：`x86`、`x64(也叫 x86-64, amd64)` 、`arm` 、`arm64`

```shell
uname -a
```

### 内核下载

[ linux kernel --  git](https://github.com/torvalds/linux) | [The Linux Kernel Archives ](https://www.kernel.org/)

```shell
git clone git://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git $KERNEL
```

### 编译内核

参考：[The Linux Kernel documentation](https://www.kernel.org/doc/html/latest/index.html) | [鸟哥私房菜--Linux 核心编译与管理](http://cn.linux.vbird.org/linux_basic/0540kernel.php)

```shell
make  defconfig
make kvm_guest.config
# make  kvmconfig
```

> ```
> "make defconfig"   Create a ./.config file by using the default  symbol values from either arch/$ARCH/defconfig or arch/$ARCH/configs/${PLATFORM}_defconfig, depending on the architecture.
> 大概意思可能是：生成默认的配置在`./.config`文件中。之后，我们可以在`./.config`中修改特定目标的配置选项。
> 或者使用make menuconfig，直接修改生成配置文件
> 
> "make kvmconfig"   Enable additional options for kvm guest kernel support.
> 大概意思可能是：内核支持kvm。
> ```

```shell
# 把规则和连带规则下的命令打印出来，但不执行
# 没啥用，打印出来我也看不懂
make defconfig --just-print
# 而我们电脑主机的当前系统配置文件查看
more /boot/config-$(uname -r)
```

```shell
# 修改几个内核配置选项，编辑./config
# Enable kernel config options required for syzkaller 
# Coverage collection.
CONFIG_KCOV=y

# Debug info for symbolization.
CONFIG_DEBUG_INFO=y

# Memory bug detector
CONFIG_KASAN=y
CONFIG_KASAN_INLINE=y

# Required for Debian Stretch
CONFIG_CONFIGFS_FS=y
CONFIG_SECURITYFS=y
```

> KernelAddressSANitizer (KASAN) is a dynamic memory error detector designed to find out-of-bound and use-after-free bugs.
>
> Generic KASAN is supported in both GCC and Clang. With GCC it requires version 8.3.0 or later. With Clang it requires version 7.0.0 or later, but detection of out-of-bounds accesses for global variables is only supported since Clang 11.
>
> 当前我的gcc是7.5，不支持这个功能。

这样修改默认配置文件有个不舒服的地方。用户自定义配置没有和默认配置分离。过段时间，我可能忘了当初设置了哪些选项。

可以参考：[以编程方式安全地更改Linux内核配置](https://qastack.cn/unix/325585/safely-changing-linux-kernel-config-programmatically) ,使用diff的方式弥补，马马虎虎吧。我当前的能力也没啥好办法。

```shell
make olddefconfig
```

> Since enabling these options results in more sub options being available, we need to regenerate config: make olddefconfig
>
> 翻译：新添加的选项可能需要一些子选项的允许，所以需要重新生成config。
> (鸟哥私房菜 make oldconfig)透过使用已存在的 ./.config 文件内容，使用该文件内的配置值为默认值，只将新版本核心内的新功能选项列出让使用者选择， 可以简化核心功能的挑选过程！对於作为升级核心原始码后的功能挑选来说，是非常好用的一个项目！
>
> ```
> "make oldconfig"   Default all questions based on the contents of your existing ./.config file and asking about  new config symbols.
> "make olddefconfig"  Like above, but sets new symbols to their default values without prompting.
> ```

明白了?反正我是不明白：[Difference between Make oldconfig and olddefconfig](https://hyunyoung2.github.io/2016/12/05/Make_config/)

编译

```shell
make
# make -j `nproc`

# 生成
ls -alh `find . -name "vmlinux"`
ls -alh `find . -name "bzImage"
```

> vmlinuz 是vmlinux 经过 gzip和objcopy  制作出来的压缩文件，当然不再是vmlinux的一个简单的压缩版，这么简单。vmlinuz是一种统称，有两种具体的表现形式zImage  和bzImage。bzimage和zImage的区别在于本身的大小，以及加载到内存时的地址不同，zImage在0～640KB，而bzImage则在1M以上的位置。[vmlinux --wiki](https://zh.wikipedia.org/wiki/Vmlinux) | [Linux内核镜像文件格式与生成过程（转）](https://www.cnblogs.com/lemaden/p/10438499.html)

<br>

## 生成磁盘映象[Disk Images]

参考：[阮一峰bash脚本教程](https://wangdoc.com/bash/)

理解生成镜像的脚本代码。了解基本的bash语法，掌握使用debootstrap生成文件系统【磁盘映象】，了解文件系统的基本配置，将文件系统复制进一个镜像文件。

### 脚本阅读

参考： [raw.githubusercontent.com与github什么关系](https://blog.csdn.net/The_Time_Runner/article/details/89737949) 

```shell
sudo apt-get install debootstrap

cd $IMAGE/
wget https://raw.githubusercontent.com/google/syzkaller/master/tools/create-image.sh -O create-image.sh
chmod +x create-image.sh
./create-image.sh
```

```bash
#!/bin/bash
# Copyright 2016 syzkaller project authors. All rights reserved.
# Use of this source code is governed by Apache 2 LICENSE that can be found in the LICENSE file.

# create-image.sh creates a minimal Debian Linux image suitable for syzkaller.

# bash 参考：[阮一峰bash脚本教程](https://wangdoc.com/bash/)

# -e脚本只要发生错误，就终止执行
# -u遇到不存在的变量就会报错，并停止执行。
# -x用来在运行结果之前，先输出执行的那一行命令。
# set -euxo pipefail,建议放在所有 Bash 脚本的头部
set -eux


# Create a minimal Debian distribution in a directory.
# chroot，预先要安装的包
DIR=chroot
PREINSTALL_PKGS=openssh-server,curl,tar,gcc,libc6-dev,time,strace,sudo,less,psmisc,selinux-utils,policycoreutils,checkpolicy,selinux-policy-default,firmware-atheros,debian-ports-archive-keyring

# If ADD_PACKAGE is not defined as an external environment variable, use our default packages
# ADD_PACKAGE:+x变量是否存在；存在且不为空，返回x;否则返回空值；用于测试变量是否存在。
# ADD_PACKAGE+x,没有考虑空
# 弯弯绕绕的，参考
# https://wangdoc.com/bash/variable.html || https://tldp.org/LDP/abs/html/parameter-substitution.html
# 如果不存在，ADD_PACKAGE赋值以下字符串;
# 也可以这么写：if ![ -z ${ADD_PACKAGE} ]; then
if [ -z ${ADD_PACKAGE+x} ]; then
    ADD_PACKAGE="make,sysbench,git,vim,tmux,usbutils,tcpdump"
fi

# Variables affected by options
# 变量赋值：x86_64,Debian9(stretch),最小安装，
# linux性能分析工具perf (这两个我没有细查)
# 见下面display_help函数
ARCH=$(uname -m)
RELEASE=stretch
FEATURE=minimal
SEEK=2047
PERF=false

# Display help function
display_help() {
    echo "Usage: $0 [option...] " >&2
    echo
    echo "   -a, --arch                 Set architecture"
    echo "   -d, --distribution         Set on which debian distribution to create"
    echo "   -f, --feature              Check what packages to install in the image, options are minimal, full"
    echo "   -s, --seek                 Image size (MB), default 2048 (2G)"
    echo "   -h, --help                 Display help message"
    echo "   -p, --add-perf             Add perf support with this option enabled. Please set envrionment variable \$KERNEL at first"
    echo
}

# bash的语法奇奇怪怪的
# 这么写可以，获取参数，咋不使用getopts
# $# 参数的个数(不包括命令本身)
# 下面左移一位，是因为没有参数；左移两位，有参数
# 两个括号，是表达式(计算)
# 试着执行下./create-image.sh -a，看下报错，可以体会 set -eux的好处
# 函数作用：提取命令行的变量
while true; do
    if [ $# -eq 0 ];then 
	echo $#
	break
    fi
    case "$1" in
        -h | --help)
            display_help
            exit 0
            ;;
        -a | --arch)
	    ARCH=$2
            shift 2
            ;;
        -d | --distribution)
	    RELEASE=$2
            shift 2
            ;;
        -f | --feature)
	    FEATURE=$2
            shift 2
            ;;
        -s | --seek)
	    SEEK=$(($2 - 1)) 
            shift 2
            ;;
        -p | --add-perf)
	    PERF=true
            shift 1
            ;;
        -*)
            echo "Error: Unknown option: $1" >&2
            exit 1
            ;;
        *)  # No more options
            break
            ;;
    esac
done

# Handle cases where qemu and Debian use different arch names
# 这里$ARCH 为啥要加引号，担心参数出现空格？当然加上一点问题没有
case "$ARCH" in
    ppc64le)
        DEBARCH=ppc64el
        ;;
    aarch64)
        DEBARCH=arm64
        ;;
    arm)
        DEBARCH=armel
        ;;
    x86_64)
        DEBARCH=amd64
        ;;
    *)
        DEBARCH=$ARCH
        ;;
esac

# Foreign architecture
# 主程序直接本地运行的时候，不需要虚拟环境
# 其他情况，我也没干过跨平台的事，我知道
FOREIGN=false
if [ $ARCH != $(uname -m) ]; then
    # i386 on an x86_64 host is exempted, as we can run i386 binaries natively
    if [ $ARCH != "i386" -o $(uname -m) != "x86_64" ]; then
        FOREIGN=true
    fi
fi

# 如果上面检出，FOREIGN=true,需要在qemu中运行
# 检查是否已安装qemu-$ARCH-static
# 推荐阅读：[ Linux 的 binfmt_misc (binfmt) module 介紹](http://yi-jyun.blogspot.com/2018/04/linux-binfmtmisc-binfmt-module.html)
if [ $FOREIGN = "true" ]; then
    # Check for according qemu static binary
    if ! which qemu-$ARCH-static; then
        echo "Please install qemu static binary for architecture $ARCH (package 'qemu-user-static' on Debian/Ubuntu/Fedora)"
        exit 1
    fi
    # Check for according binfmt entry
    if [ ! -r /proc/sys/fs/binfmt_misc/qemu-$ARCH ]; then
        echo "binfmt entry /proc/sys/fs/binfmt_misc/qemu-$ARCH does not exist"
        exit 1
    fi
fi

# Double check KERNEL when PERF is enabled
if [ $PERF = "true" ] && [ -z ${KERNEL+x} ]; then
    echo "Please set KERNEL environment variable when PERF is enabled"
    exit 1
fi

# If full feature is chosen, install more packages
# bash的字符串拼接，简单粗暴
if [ $FEATURE = "full" ]; then
    PREINSTALL_PKGS=$PREINSTALL_PKGS","$ADD_PACKAGE
fi

sudo rm -rf $DIR
sudo mkdir -p $DIR
sudo chmod 0755 $DIR

# 1. debootstrap stage

DEBOOTSTRAP_PARAMS="--arch=$DEBARCH --include=$PREINSTALL_PKGS --components=main,contrib,non-free $RELEASE $DIR"
if [ $FOREIGN = "true" ]; then
    DEBOOTSTRAP_PARAMS="--foreign $DEBOOTSTRAP_PARAMS"
fi

# riscv64 is hosted in the debian-ports repository
# debian-ports doesn't include non-free, so we exclude firmware-atheros
if [ $DEBARCH == "riscv64" ]; then
    DEBOOTSTRAP_PARAMS="--keyring /usr/share/keyrings/debian-ports-archive-keyring.gpg --exclude firmware-atheros $DEBOOTSTRAP_PARAMS http://deb.debian.org/debian-ports"
fi

# 使用man debootstrap,查看参数的含义
sudo debootstrap $DEBOOTSTRAP_PARAMS

# 2. debootstrap stage: only necessary if target != host architecture
# 静态的二进制文件qemu-$arch-static，作为interpreter，来执行特定架构的可执行文件
# 切换根目录,执行脚本/debootstrap/debootstrap --second-stage，完成引导过程。
if [ $FOREIGN = "true" ]; then
    sudo cp $(which qemu-$ARCH-static) $DIR/$(which qemu-$ARCH-static)
    sudo chroot $DIR /bin/bash -c "/debootstrap/debootstrap --second-stage"
fi

# Set some defaults and enable promtless ssh to the machine for root.
# 配置文件系统，注释见下一节
sudo sed -i '/^root/ { s/:x:/::/ }' $DIR/etc/passwd
echo 'T0:23:respawn:/sbin/getty -L ttyS0 115200 vt100' | sudo tee -a $DIR/etc/inittab
# printf '\nauto eth0\niface eth0 inet dhcp\n' | sudo tee -a $DIR/etc/network/interfaces
# 脚本中这一行，修改成如下内容
printf '\nauto enp0s3\niface enp0s3 inet dhcp\n' | sudo tee -a $DIR/etc/network/interfaces
echo '/dev/root / ext4 defaults 0 0' | sudo tee -a $DIR/etc/fstab
echo 'debugfs /sys/kernel/debug debugfs defaults 0 0' | sudo tee -a $DIR/etc/fstab
echo 'securityfs /sys/kernel/security securityfs defaults 0 0' | sudo tee -a $DIR/etc/fstab
echo 'configfs /sys/kernel/config/ configfs defaults 0 0' | sudo tee -a $DIR/etc/fstab
echo 'binfmt_misc /proc/sys/fs/binfmt_misc binfmt_misc defaults 0 0' | sudo tee -a $DIR/etc/fstab
echo "kernel.printk = 7 4 1 3" | sudo tee -a $DIR/etc/sysctl.conf
echo 'debug.exception-trace = 0' | sudo tee -a $DIR/etc/sysctl.conf
echo "net.core.bpf_jit_enable = 1" | sudo tee -a $DIR/etc/sysctl.conf
echo "net.core.bpf_jit_kallsyms = 1" | sudo tee -a $DIR/etc/sysctl.conf
echo "net.core.bpf_jit_harden = 0" | sudo tee -a $DIR/etc/sysctl.conf
echo "kernel.softlockup_all_cpu_backtrace = 1" | sudo tee -a $DIR/etc/sysctl.conf
echo "kernel.kptr_restrict = 0" | sudo tee -a $DIR/etc/sysctl.conf
echo "kernel.watchdog_thresh = 60" | sudo tee -a $DIR/etc/sysctl.conf
echo "net.ipv4.ping_group_range = 0 65535" | sudo tee -a $DIR/etc/sysctl.conf
echo -en "127.0.0.1\tlocalhost\n" | sudo tee $DIR/etc/hosts
echo "nameserver 8.8.8.8" | sudo tee -a $DIR/etc/resolve.conf
echo "syzkaller" | sudo tee $DIR/etc/hostname
ssh-keygen -f $RELEASE.id_rsa -t rsa -N ''
sudo mkdir -p $DIR/root/.ssh/
cat $RELEASE.id_rsa.pub | sudo tee $DIR/root/.ssh/authorized_keys

# Add perf support
# 这个性能分析工具别用了，偷懒。
# 脚本这里仅仅是编译安装了下
if [ $PERF = "true" ]; then
    cp -r $KERNEL $DIR/tmp/
    sudo chroot $DIR /bin/bash -c "apt-get update; apt-get install -y flex bison python-dev libelf-dev libunwind8-dev libaudit-dev libslang2-dev libperl-dev binutils-dev liblzma-dev libnuma-dev"
    sudo chroot $DIR /bin/bash -c "cd /tmp/linux/tools/perf/; make"
    sudo chroot $DIR /bin/bash -c "cp /tmp/linux/tools/perf/perf /usr/bin/"
    rm -r $DIR/tmp/linux
fi

# Add udev rules for custom drivers.
# Create a /dev/vim2m symlink for the device managed by the vim2m driver
echo 'ATTR{name}=="vim2m", SYMLINK+="vim2m"' | sudo tee -a $DIR/etc/udev/rules.d/50-udev-default.rules

# Build a disk image
dd if=/dev/zero of=$RELEASE.img bs=1M seek=$SEEK count=1
sudo mkfs.ext4 -F $RELEASE.img
sudo mkdir -p /mnt/$DIR
sudo mount -o loop $RELEASE.img /mnt/$DIR
sudo cp -a $DIR/. /mnt/$DIR/.
sudo umount /mnt/$DIR
```

<br>

### 构建文件系统

参考：[Debootstrap -- 官网](https://wiki.debian.org/zh_CN/Debootstrap) | [Debian 发行版本](https://www.debian.org/releases/index.zh-cn.html) | [Debian 软件包管理 --太长了，略](https://www.debian.org/doc/manuals/debian-reference/ch02.zh-cn.html)

> debootstrap 是一个可以快速获得基本 Debian 系统的一个工具。debootstrap 的工作是将基本的 Debian 系统安装到一个目录上, 然后可以通过 chroot 切换到新安装的 Debian 系统.  [ubuntu系统debootstrap -- 实例](https://www.latelee.org/using-gnu-linux/ubuntu-debootstrap-iii.html)

```shell
PREINSTALL_PKGS=openssh-server,curl,tar,gcc,libc6-dev,time,strace,sudo,less,psmisc,selinux-utils,policycoreutils,checkpolicy,selinux-policy-default,\
firmware-atheros,debian-ports-archive-keyring[,make,sysbench,git,vim,tmux,usbutils,tcpdump]
# 目标架构x86_64，下载解压上面的包，使用组件main,contrib,non-free中的包
# main     Debian 里最基本及主要且符合自由软件规范的软件 ( packages )。
# contrib     这里头软件虽然可以在 Debian 里头运作，即使本身属于自由软件但多半却是相依于非自由 ( non-free ) 软件。
# non-free   不属于自由软件范畴的软件。
# stretch ,安装的系统是debian9。安装目录是当前目录下chroot目录
sudo debootstrap  --arch=x86_64 --include=$PREINSTALL_PKGS  --components=main,contrib,non-free  stretch ./chroot
```

**这里构建一个文件系统，否则光光上面创建一个内核用不了**。 

<br>

### 修改文件系统

```shell
# 去除密码？
# [正则表达式和 SED](https://wiki.jikexueyuan.com/project/unix/regular-expressions.html)
# 将/chroot/etc/passwd 中root开头，将':x:'替换成'::'。可以这样操作？
sudo sed -i '/^root/ { s/:x:/::/ }' $DIR/etc/passwd

# 设置启动-》终端
# [linux中/etc/inittab文件分析](https://my.oschina.net/u/4287454/blog/3913810)
# tee命令用于将数据重定向到文件，另一方面还可以提供一份重定向数据的副本作为后续命令的stdin。简单的说就是把数据重定向到给定文件和屏幕上。
# 这里是将 'T0:23:respawn:/sbin/getty -L ttyS0 115200 vt100' 追加到/chroot/etc/passwd
# init进程是系统所有进程的起点，Linux在完成核内引导以后，就开始运行init程序
# init程序需要读取配置文件/etc/inittab。inittab是一个不可执行的文本文件，它有若干行指令所组成
# 运行级别的配置:label:runlevel:action:process
# T0标签；2,3 level,多用户命令模式；respawn：init应该监视这个进程，即使其结束后也应该被重新启动。
# 运行/sbin/getty -L ttyS0 115200 vt100，设置0号虚拟控制台，本地连接，波特率115200，默认vt100
echo 'T0:23:respawn:/sbin/getty -L ttyS0 115200 vt100' | sudo tee -a $DIR/etc/inittab

# 修改网网络配置
# [虚拟机双网卡配置 -- 我以前整理的ubuntu中网络配置](https://blog.csdn.net/sinat_38816924/article/details/107831886)
# [/etc/network/interfaces文件](https://wizardforcel.gitbooks.io/llthw/content/ex25.html)
# printf '\nauto eth0\niface eth0 inet dhcp\n' | sudo tee -a $DIR/etc/network/interfaces
# 脚本中这一行，修改成如下内容
printf '\nauto enp0s3\niface enp0s3 inet dhcp\n' | sudo tee -a $DIR/etc/network/interfaces

# 自动挂载
# /dev/root，我去翻看debian的官方文档中，关于设备文件，没着找见。。
# debugfs 是设计用于调试的特殊文件系统
# securityfs、configfs、binfmt_misc略，不想查了
echo '/dev/root / ext4 defaults 0 0' | sudo tee -a $DIR/etc/fstab
echo 'debugfs /sys/kernel/debug debugfs defaults 0 0' | sudo tee -a $DIR/etc/fstab
echo 'securityfs /sys/kernel/security securityfs defaults 0 0' | sudo tee -a $DIR/etc/fstab
echo 'configfs /sys/kernel/config/ configfs defaults 0 0' | sudo tee -a $DIR/etc/fstab
echo 'binfmt_misc /proc/sys/fs/binfmt_misc binfmt_misc defaults 0 0' | sudo tee -a $DIR/etc/fstab

# 直接通过修改sysctl.conf文件来修改Linux内核参数
# 很明显可以看到分类：net，kernel;【debug？？】
# [Index of /doc/Documentation/ --> 找见sysctl](https://www.kernel.org/doc/Documentation/)
# [The Linux Kernel documentation --> 没找见sysctl-->奇怪](https://www.kernel.org/doc/html/latest/index.html#)
# kernel.printk中的四个值分别表示:控制台日志级别、默认消息日志级别、最小控制台日志级别和默认控制台日志级别。
echo "kernel.printk = 7 4 1 3" | sudo tee -a $DIR/etc/sysctl.conf
echo 'debug.exception-trace = 0' | sudo tee -a $DIR/etc/sysctl.conf
echo "net.core.bpf_jit_enable = 1" | sudo tee -a $DIR/etc/sysctl.conf
echo "net.core.bpf_jit_kallsyms = 1" | sudo tee -a $DIR/etc/sysctl.conf
echo "net.core.bpf_jit_harden = 0" | sudo tee -a $DIR/etc/sysctl.conf
echo "kernel.softlockup_all_cpu_backtrace = 1" | sudo tee -a $DIR/etc/sysctl.conf
echo "kernel.kptr_restrict = 0" | sudo tee -a $DIR/etc/sysctl.conf
echo "kernel.watchdog_thresh = 60" | sudo tee -a $DIR/etc/sysctl.conf
echo "net.ipv4.ping_group_range = 0 65535" | sudo tee -a $DIR/etc/sysctl.conf

# DNS配置，主机名配置
echo -en "127.0.0.1\tlocalhost\n" | sudo tee $DIR/etc/hosts
echo "nameserver 8.8.8.8" | sudo tee -a $DIR/etc/resolve.conf
echo "syzkaller" | sudo tee $DIR/etc/hostname

# 生成密钥对，并将放置公钥。(空表示没有密语。如果认为自己的私钥安全不会丢失)
ssh-keygen -f $RELEASE.id_rsa -t rsa -N ''
sudo mkdir -p $DIR/root/.ssh/
cat $RELEASE.id_rsa.pub | sudo tee $DIR/root/.ssh/authorized_keys

# 设备的底层支持是在内核层面处理的，但是，它们相关的事件管理是在用户空间中通过 udev 来管理的
# [udev (简体中文 --wiki)](https://wiki.archlinux.org/index.php/Udev_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))
# 确实比较有意思，之前没有考虑过，插入外设的时候，名称会动态变化，如何控制。
# 为由vim2m驱动程序管理的设备创建/dev/vim2m符号链接
echo 'ATTR{name}=="vim2m", SYMLINK+="vim2m"' | sudo tee -a $DIR/etc/udev/rules.d/50-udev-default.rules

# Build a disk image
# 一个 loop 设备必须要和一个文件进行连接；
# 如果这个文件包含有一个完整的文件系统，那么这个文件就可以像一个磁盘设备一样被 mount 起来 
# 像把数据复制到磁盘一样，把文件系统复制到镜像文件中，有意思。
# 至于深层次，为啥叫loop设备，我不知道了。
dd if=/dev/zero of=$RELEASE.img bs=1M seek=$SEEK count=1
sudo mkfs.ext4 -F $RELEASE.img
sudo mkdir -p /mnt/$DIR
sudo mount -o loop $RELEASE.img /mnt/$DIR
sudo cp -a $DIR/. /mnt/$DIR/.
sudo umount /mnt/$DIR
```

<br>

## QEMU 

如果出现报错，参看本文的错误处理小节。

### 启动

参考文章：[QEMU documentation -- 官网](https://www.qemu.org/documentation/) 

当然，如果之前没接触过qemu，可以看[虚拟机qemu体验](https://m.linuxidc.com/Linux/2015-03/114461.htm) (官网的[quick start](https://www.qemu.org/docs/master/system/quickstart.html) 不太友好)。最简单的入门：创建镜像，安装操作系统，分配内存/cpu/显卡。

> QEMU有多种模式
>
> - User mode：又称作“用户模式”，在这种模块下，QEMU运行针对不同指令编译的单个Linux或Darwin操作系统/macOS程序。系统调用与32/64位接口适应。在这种模式下，我们可以实现交叉编译（cross-compilation）与交叉侦错（cross- debugging）。
> - System  mode：“系统模式”，在这种模式下，QEMU模拟一个完整的计算机系统，包括外围设备。它可以用于在一台计算机上提供多台虚拟计算机的虚拟主机。  QEMU可以实现许多客户机OS的引导，比如x86，MIPS，32-bit ARMv7，PowerPC等等。
> - KVM Hosting：QEMU在这时处理KVM镜像的设置与迁移，并参加硬件的仿真，但是客户端的执行则由KVM完成。
> - Xen Hosting：在这种托管下，客户端的执行几乎完全在Xen中完成，并且对QEMU屏蔽。QEMU只提供硬件仿真的支持
> - [QEMU -- wiki](https://zh.wikipedia.org/wiki/QEMU)

```shell
sudo apt-get install qemu-system-x86

qemu-system-x86_64 \
	-m 2G \
	-smp 2 \
	-kernel $KERNEL/arch/x86/boot/bzImage \
	-append "console=ttyS0 root=/dev/sda earlyprintk=serial" \
	-drive file=$IMAGE/stretch.img,format=raw \
	-net user,host=10.0.2.10,hostfwd=tcp:127.0.0.1:10021-:22 \
	-net nic,model=e1000 \
	-enable-kvm \
	-nographic \
	-pidfile vm.pid \
	2>&1 | tee vm.log
```

```markdown
总体注释：细节忽略

-m [size=]megs[,slots=n,maxmem=size]
    Sets guest startup RAM size to megs megabytes. Default is 128 MiB. Optionally, a suffix of “M” or “G” can be used to signify a value in megabytes or gigabytes respectively. Optional pair slots, maxmem could be used to set amount of hotpluggable memory slots and maximum amount of memory. Note that maxmem must be aligned to the page size.
举例：qemu-system-x86_64 -m 1G,slots=3,maxmem=4G
解析：初始分配1G内存。还有3个热拔插的内存条插槽，最大内存可以到4G。(内存可以热拔插呢？)

-smp [cpus=]n[,cores=cores][,threads=threads][,dies=dies][,sockets=sockets][,maxcpus=maxcpus]
    Simulate an SMP system with n CPUs. On the PC target, up to 255 CPUs are supported. On Sparc32 target, Linux limits the number of usable CPUs to 4. For the PC target, the number of cores per die, the number of threads per cores, the number of dies per packages and the total number of sockets can be specified. Missing values will be computed. If any on the three values is given, the total number of CPUs n can be omitted. maxcpus specifies the maximum number of hotpluggable CPUs.
注释：SMP (Symmetric Multi Processing),对称多处理系统内有许多紧耦合多处理器，在这样的系统中，共享资源，多个CPU之间没有区别
举例：-smp 2
解析：分配两个cpu

-kernel bzImage
    Use bzImage as kernel image. The kernel can be either a Linux kernel or in multiboot format.
注释：执行内核，内核格式得是bzImage格式

-append cmdline
    Use cmdline as kernel command line
注释：添加内核命令行，具体我不懂。[The kernel’s command-line parameters -- 官网](https://www.kernel.org/doc/html/v4.14/admin-guide/kernel-parameters.html)
举例：-append "console=ttyS0 root=/dev/sda earlyprintk=serial"
解析1：输出控制台ttyS0，这个命令台在(之后)上面镜像中设置为，"getty -L ttyS0 115200 vt100"
解析2：根文件系统在/dev/sda
解析3：earlyprintk is useful when the kernel crashes before the normal console is initialized.（这里后面没有跟数字，是设置成?）

-drive option[,option[,option[,...]]]
    Define a new drive. This includes creating a block driver node (the backend) as well as a guest device, and is mostly a shortcut for defining the corresponding -blockdev and -device options.
    -drive accepts all options that are accepted by -blockdev. In addition, it knows the following options:
注释：定义一个新的驱动(结合具体的option来看)。
举例：-drive file=$IMAGE/stretch.img,format=raw
解析1：file指定磁盘映像位置
解析2：format指定将使用哪种磁盘格式，而不是检测格式。可用于指定format=raw，以避免解释不可信的格式标头。(是直接不解释？)

-net user|tap|bridge|socket|l2tpv3|vde[,...][,name=name]
    Configure a host network backend (with the options corresponding to the same -netdev option) and connect it to the emulated hub 0 (the default hub). Use name to specify the name of the hub port.
注释：和-netdev(-netdev user,id=id[,option][,option][,...])参数相同，连接到一个模拟集线器0上。
举例：-net user,host=10.0.2.10,hostfwd=tcp:127.0.0.1:10021-:22
解析1：配置用户模式的主机后端。客户机看到主机的网址是10.0.2.10
解析2：将主机:127.0.0.1:10021的端口内容转发到客户机的22号端口。
解析3：这挺好理解，从外面控制虚拟机，ssh root@127.0.0.1 -p 10021，流量转发到客户机的22好端口。

-net nic[,netdev=nd][,macaddr=mac][,model=type] [,name=name][,addr=addr][,vectors=v]
    Legacy option to configure or create an on-board (or machine default) Network Interface Card(NIC) and connect it either to the emulated hub with ID 0 (i.e. the default hub), or to the netdev nd. If model is omitted, then the default NIC model associated with the machine type is used. Note that the default NIC model may change in future QEMU releases, so it is highly recommended to always specify a model. Optionally, the MAC address can be changed to mac, the device address set to addr (PCI cards only), and a name can be assigned for use in monitor commands. Optionally, for PCI cards, you can specify the number v of MSI-X vectors that the card should have; this option currently only affects virtio cards; set v = 0 to disable MSI-X. If no -net option is specified, a single NIC is created. QEMU can emulate several different models of network card. Use -net nic,model=help for a list of available devices for your target.
举例：-net nic,model=e1000
解析：客户机虚拟个网卡e1000

-enable-kvm
    Enable KVM full virtualization support. This option is only available if KVM support is enabled when compiling.
启用KVM完全虚拟化支持。

-nographic
    Normally, if QEMU is compiled with graphical window support, it displays output such as guest graphics, guest console, and the QEMU monitor in a window. With this option, you can totally disable graphical output so that QEMU is a simple command line application. The emulated serial port is redirected on the console and muxed with the monitor (unless redirected elsewhere explicitly). Therefore, you can still use QEMU to debug a Linux kernel with a serial console. Use C-a h for help on switching between the console and monitor.
关闭图形化输出，使用命令行。

-pidfile file
-pidfile vm.pid
    Store the QEMU process PID in file. It is useful if you launch QEMU from a script.
很有用的文件吗？拭目以待。

2>&1 | tee vm.log
闭着眼猜测，错误写入标准输出和【日志】中
```

<br>

### 连接

```shell
# 从主机连接到虚拟机
# -i 指定私钥位置
# -o "StrictHostKeyChecking no"，第一次连接主机的时候不进行公钥确认，以自动化
# -p 100021 端口和localhost，是因为qemu上面选项中主机的端口转发
# 不需要验证口令的，应为上面创建秘钥的时候，口令为空
ssh -i  ./image/stretch.id_rsa -p 10021 -o "StrictHostKeyChecking no" root@localhost
```

<br>

### 关闭

kill qemu的进程

```shell
# -pidfile vm.pid
kill `cat vm.pid | grep -v '^$'`
```

<br>



### 报错处理

1. **权限不够报错与处理**

```shell
# 普通用户身份运行
qemu-system-x86_64 \
        -m 2G \
        -smp 2 \
        -kernel ./linux/arch/x86/boot/bzImage \
        -append "console=ttyS0 root=/dev/sda earlyprintk=serial" \
        -drive file=./image/stretch.img,format=raw \
        -net user,host=10.0.2.10,hostfwd=tcp:127.0.0.1:10021-:22 \
        -net nic,model=e1000 \
        -enable-kvm \
        -nographic \
        -pidfile vm.pid \
        2>&1 | tee vm.log
        
# 报错
Could not access KVM kernel module: Permission denied
qemu-system-x86_64: failed to initialize KVM: Permission denied

# 简单查看
ls -alh /dev/kvm
crw-rw---- 1 root kvm 10, 232 10月 19 21:54 /dev/kvm

whereis qemu-system-x86_64
qemu-system-x86_64: /usr/bin/qemu-system-x86_64 /usr/share/man/man1/qemu-system-x86_64.1.gz

ls -alh /usr/bin/qemu-system-x86_64
-rwxr-xr-x 1 root root 12M 9月  15 22:05 /usr/bin/qemu-system-x86_64
```

在开始尝试解决这个问题之前，基本的内核模块加载是背景(当然没啥影响)，可以参考： [Linux Kernel 实践(一)：Hello LKM](https://limxw.com/posts/linux-kernel-practice-hello/) (实现一个简单的 Linux Kernel Module 并通过自定义参数输出信息)

我们先把问题放在google中搜索。中文搜不到，就用英文搜索。关于这个问题，我翻来覆去只搜到一种方法：[Talk:KVM (简体中文)](https://wiki.archlinux.org/index.php/Talk:KVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) | [解决“Could not access KVM kernel module: Permission denied ”](http://f.dataguru.cn/thread-127360-1-1.html) 。**但这种解法并不为我喜欢。因为它只告诉我们操作方法，并没有告诉我们，为什么要这样操作**。(后面的分析过程也会证明这里的操作并不是一个好方法)

但多少上面的操作给了我们思路。思路出现在`libvirt` 上。这是什么东西？ 下面的思路就是要搞清楚，“qemu kvm Libvirtd qemu-system-x86_64 之间的管关系”。可以参考：[我是虚拟机内核我困惑？！](https://mp.weixin.qq.com/s?__biz=MzI1NzYzODk4OQ==&mid=2247483820&idx=1&sn=8a44b992491aea03e55eefb4815a1958&chksm=ea15168edd629f98e622dcb94e64fbb4a75055da98d620e7c83071b5d6d428904fa5c8e9c4ad&scene=21#wechat_redirect) | [Qemu，KVM，Virsh傻傻的分不清](https://www.cnblogs.com/popsuper1982/p/8522535.html)

> 首先看qemu，其中关键字emu，全称emulator，模拟器，所以单纯使用qemu是采用的完全虚拟化的模式。
>
> 按照上一次的理论，完全虚拟化是非常慢的，所以要使用硬件辅助虚拟化技术Intel-VT，AMD-V，所以需要CPU硬件开启这个标志位，一般在BIOS里面设置。查看是否开启。当确认开始了标志位之后，通过KVM，GuestOS的CPU指令不用经过Qemu转译，直接运行，大大提高了速度。
>
> 所以KVM在内核里面需要有一个模块，来设置当前CPU是Guest OS在用，还是Host OS在用。KVM内核模块通过/dev/kvm暴露接口，用户态程序可以通过ioctl来访问这个接口。
>
> Qemu将KVM整合进来，通过ioctl管理/dev/kvm，将有关CPU指令的部分交由内核模块来做，就是qemu-kvm (qemu-system-XXX)。qemu和kvm整合之后，CPU的性能问题解决了，另外Qemu还会模拟其他的硬件，如Network, Disk，同样全虚拟化的方式也会影响这些设备的性能。
>
> 然而直接用qemu或者qemu-kvm或者qemu-system-xxx的少，大多数还是通过virsh启动，virsh属于libvirt工具，libvirt是目前使用最为广泛的对KVM虚拟机进行管理的工具和API，可不止管理KVM。Libvirt分服务端和客户端，Libvirtd是一个daemon进程，是服务端，可以被本地的virsh调用，也可以被远程的virsh调用，virsh相当于客户端。
>
> qemu是一个用户空间的程序，kvm是一个运行于内核空间的程序。kvm开发团队借用了qemu代码，并作了一些修改，形成了一套工具，也就是qemu-kvm。如何让qemu与kvm内核模块结合起来，这时，/dev/kvm就起作用了。/dev/kvm是一个字符设备，当qemu打开这个设备后，通过ioctl这个系统调用就可以获得kvm模块提供的三个抽象对象。[/dev/kvm简单理解 ](https://blog.51cto.com/1054383/1664143)
>
> **Libvirtd调用qemu-kvm操作虚拟机。有关CPU虚拟化的部分，qemu-kvm调用kvm的内核模块来实现**

**小结1**：syzkaller上面操作直接使用qemu-system-x86_64，并没有使用[Libvirtd](https://wiki.archlinux.org/index.php/libvirt_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))。而[网上查到的方式](http://f.dataguru.cn/thread-127360-1-1.html) 目测是给qemu的执行过程赋予root权限。有root基本可以解决所有Permission denied问题。所以网上查到的方法可以克服问题，但是并没有从根本上分析问题。因为它只是针对libvirtd，而不是站在syzkaller仓库使用kvm的背景下。

**小结2**：[通过ioctl管理/dev/kvm -- kernel KVM API Documentation](https://www.kernel.org/doc/Documentation/virtual/kvm/api.txt) 。（我不知道“Permission denied”这个字符串是哪个程序在什么样的情况下输出的）由于系统调用，用户态和系统态之间的转换。这是我多年前抄书的[中断 -- 用户/内核切换](https://blog.csdn.net/sinat_38816924/article/details/97958623) 。我随手搜索了另一篇长的差不多的[用户态到内核态切换博客](http://abcdxyzk.github.io/blog/2015/06/02/kernel-sched-user-to-kernel/) 。（具体实现我看不懂，看点结论就好）。我用普通用户的身份执行qemu-system-x86_64命令，由于参数-enable-kvm，会执行ioctl管理/dev/kvm。在使用ioctl之前，需要open("/dev/kvm") obtains a handle，<font color=red>这时候就会发现普通用户对/dev/kvm毛权限都没有</font>。所以会出现了Permission denied。

**解决** ：使用root和sudo都不是好方法。<font color=red>最好的方法是将当前用户，加入kvm用户组</font>。

```shell
# 可以看到kvm组中没有任何用户
cat /etc/group | grep kvm
kvm:x:127:

# 将当前用户加入kvm用户组
sudo usermod -aG kvm $USER

# 此时重新运行上面命令qemu-system-x86_64，发现还是相同的报错
# 有点尴尬。←思→想，难道是由于和内核有点关系，没有生效？
# 查了下，没找见不用关机便能生效的方法
# 于是乎，随手关机重启。和我期望的一样，不用root权限便可以执行上面命令qemu-system-x86_64
```

> 感叹的是，我之后在**Troubleshooting**看到了同样的解决办法
>
> QEMU requires root for `-enable-kvm`.
>
> Solution: add your user to the `kvm` group (`sudo usermod -a -G kvm` and relogin).

2. **启动网卡报错与处理**

```shell
[FAILED] Failed to start Raise network interfaces.
# 我直接搜：syzkallyer  Failed to start Raise network interfaces
# 没有找见合适的issue，于是乎开始分析

# 构建的文件系统中关于网卡的配置
# 使用root直接进入syzkallyer系统查看，已生效
printf '\nauto eth0\niface eth0 inet dhcp\n' | sudo tee -a $DIR/etc/network/interfaces
auto eth0
iface eth0 inet dhcp

# 手动启动网卡,失败，如下
# 虚拟机没有虚拟网卡eth0
ifup eth0
Cannot find device "eth0"
Failed to get interface index: No such device

# 当时当前的虚拟机已经有网卡enp0s3
ip link show
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: enp0s3: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff
3: sit0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/sit 0.0.0.0 brd 0.0.0.0
 
# 我用半个脑子一想，加上过往的经验，便知道是网卡的配置文件写错了。
# /etc/network/interfaces应该这样配置
# 所以在执行官网的脚本之前，把脚本中的这一行
# printf '\nauto eth0\niface eth0 inet dhcp\n' | sudo tee -a $DIR/etc/network/interfaces
# 改成：printf '\nauto enp0s3\niface enp0s3 inet dhcp\n' | sudo tee -a $DIR/etc/network/interfaces
# 我过往的经验，可以参考：[VirtualBox虚拟机双网卡配置](https://blog.csdn.net/sinat_38816924/article/details/107831886)
# 配置文件根据具体的内容而设定。现在默认的网卡名称是 enp0s3，而不是eth0
auto enp0s3
iface enp0s3 inet dhcp

# 我们查看结果
ip link show
ip addr show

# 重新启动，没有报错，漂亮
# -pidfile vm.pid
kill `cat vm.pid | grep -v '^$'`
qemu-system-x86_64 \
        -m 2G \
        -smp 2 \
        -kernel ./linux/arch/x86/boot/bzImage \
        -append "console=ttyS0 root=/dev/sda earlyprintk=serial" \
        -drive file=./image/stretch.img,format=raw \
        -net user,host=10.0.2.10,hostfwd=tcp:127.0.0.1:10021-:22 \
        -net nic,model=e1000 \
        -enable-kvm \
        -nographic \
        -pidfile vm.pid \
        2>&1 | tee vm.log
```

<br>

## syzkaller

### go环境安装

参考文章：[go Documentation -- 官网](https://golang.org/doc/) | [配置环境变量 -- 鸟哥](http://cn.linux.vbird.org/linux_basic/fedora_4/0320bash-fc4.php#settings_bashrc)

> ~/.bashrc:鸟哥一般都是将自己的需要输入在这个档案里面的呢！我的个人化设定值都会写在这里说～例如命令别名、路径等等。

```shell
wget https://dl.google.com/go/go1.14.2.linux-amd64.tar.gz
tar -xf go1.14.2.linux-amd64.tar.gz
mv go goroot
export GOROOT=`pwd`/goroot
export PATH=$GOROOT/bin:$PATH
```

当然，我建议在整个系统中安装go

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

### syzkaller的下载与构建

```shell
export GOPATH=`pwd`/gopath
export GOROOT=`pwd`/goroot
export PATH=$GOPATH/bin:$PATH
export PATH=$GOROOT/bin:$PATH

go get -u -d github.com/google/syzkaller/prog # get的源码在$GOROOT中
cd gopath/src/github.com/google/syzkaller/
make
```

[go get命令——一键获取代码、编译并安装](http://c.biancheng.net/view/123.html) ：-d只下载不安装；-u强制使用网络去更新包和它的依赖包。

它的构建阅读过程，暂时跳过。[尴尬的是，构建的时候，电脑卡死。可能是硬件跟不上？]

### 运行syzkaller

先创建配置文件my.cfg。

```shell
{
	"target": "linux/amd64",
	"http": "127.0.0.1:56741",
	"workdir": "$GOPATH/src/github.com/google/syzkaller/workdir",
	"kernel_obj": "$KERNEL",
	"image": "$IMAGE/stretch.img",
	"sshkey": "$IMAGE/stretch.id_rsa",
	"syzkaller": "$GOPATH/src/github.com/google/syzkaller",
	"procs": 8,
	"type": "qemu",
	"vm": {
		"count": 4,
		"kernel": "$KERNEL/arch/x86/boot/bzImage",
		"cpu": 2,
		"mem": 2048
	}
}
```

运行 syzkaller manager。

```shell
mkdir workdir
GOPATH=../gopath KERNEL=../linux IMAGE=../image  ./bin/syz-manager -config=my.cfg
```

<br>



## 系统备份

参考文章：[rsync 用法教程](https://www.ruanyifeng.com/blog/2020/08/rsync.html) | [timeshift](https://github.com/teejee2008/timeshift) | [建立强大的备份系统 -- 不懂](https://www.vincehut.top/index.php/2020/05/02/%E5%BB%BA%E7%AB%8B%E5%BC%BA%E5%A4%A7%E7%9A%84%E5%A4%87%E4%BB%BD%E7%B3%BB%E7%BB%9F/) 

安装陌生软件之前，系统的备份不可少(代价是消耗我13G的硬盘)。timeshift使用：鼠标点点点就好。

**RSYNC快照**

* 快照的创建方式是使用 rsync来创建系统文件的副本,以及从以前的快照中硬链接未更改的文件。
* **在创建首个快照时,所有文件都会被复制。后续的快照将在此基础上增加,未更改的文件会硬链接到以前的快照**。
* 快照可以保存到任一个格式化为 Linux文件系统的磁盘。请将快照保存到非系统或外部磁盘,这样即使系统磁盘损坏或者被重新格式化,也可以恢复系统
* 您可以排除文件和目录以节省磁盘空间

**设置**

* 每周三个快照。
* 可以通过恢复快照将系统回滚到之前的日期的系统。
* **恢复快照时只替换系统文件和设置。不会触及用户主目录中的非隐藏文件和目录**。要想更改此行为,可以通过添加筛选器来包含这些文件。所包含的文件将在创建快照时备份,在恢复快照时将被替换（**我没有备份用户目录中的所有数据**。用户必要数据，通过网盘/仓库保存）。
* 为防止驱动器故障,请将快照保存到外部磁盘,而不是系统磁盘请将快照保存到非系统磁盘,这样您可以格式化系统磁盘,或者在它上面重新安装操作系统,而不会丢失存储在系统磁盘上的快照。您甚至可以安装另ー个 Linux发行版然后通过恢复快照来回滚以前的发行版（目前使用的电脑中只有一个硬盘，我平时不咋用的的硬盘没带。或许可以把它通过usb插在电脑上，让系统多一个[备份|数据]盘）。