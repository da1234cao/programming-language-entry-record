[TOC]

## 前言

本博客要求：可以根据需要，自行搭建基础的linux实验环境。

编译内核要求：可以通过checkout，编译任何指定版本的内核。

制作disk image要求：可以自行填充busybox等信息制作一个initrd；可以借助debootstrap制作并修改成一个可以正常使用的disk image。

qemu要求：启动的时候可以指定bzImage和disk image；可以设置访问外网；可以设置主机和虚拟机之间共享文件件。

builtroot：了解即可。

ps：在阅读这篇blog之前，建议先阅读：[syzkaller安装](https://blog.csdn.net/sinat_38816924/article/details/116520661)

<br>

## 编译linux内核

我fork一份[linux源码](https://github.com/torvalds/linux)到[自己的仓库](https://github.com/da1234cao/linux)。主分支定期拉取上游仓库，使得可以看到最新的linux内核源码。

当需要特定版本的内核操作实验的时候，checkout过去就好。实验后作为分支上传到自己的仓库。

编译的时候全部，全部编译的外面的目录。

**这样便一直有一份最新的源码，随时可以切换到特定的版本**。非常方便。

<br>

### 下载内核源码

[git文件名大小写问题](https://www.worldhello.net/gotgit/08-git-misc/030-case-insensitive.html)：我电脑的磁盘空间不够，外接一个U盘。U盘开始采用fat格式，clone linux之后，出现文件大小写问题。所以我将U盘部分格式化为ext4，重新clone。

[Github进行fork后如何与原仓库同步：重新fork很省事，但不如反复练习版本合并](https://github.com/selfteaching/the-craft-of-selfteaching/issues/67)：为了更好的查看和修改代码，我frok了linux到我的仓库。

```shell
# 我fork了linux到我的仓库
git clone git@github.com:da1234cao/linux.git

# [该commit](https://github.com/torvalds/linux/commit/581738a681b6faae5725c2555439189ca81c0f1f)
# 在5.5版本中引入，也影响到5.6版本
git show 581738a681b6faae57 # 查看commit信息
git branch --contains 581738a681b6faae57 # 查看该commit对应的分支
git tag --contains 581738a681b6faae57 # 从当前的commit往后查找tag

# 切换到v5.6
git checkout v5.6
```

```shell
##### 为了和上游保持同步
# 添加上游仓库
git remote add upstream git@github.com:torvalds/linux.git
git remote -v # 查看你的远程仓库的路径

##### 漏洞自建一个分支，以后所有关于该漏洞的内容都提交到该分支

# 我checkout 5.6之后，没有先创建分支，直接修改了5.6的版本
git stash # 在当前分支上的修改暂存起来
git branch CVE-2020-8835
git checkout CVE-2020-8835
git stash pop # 将暂存的修改放到新建分支中
git add .
git commit 
git push origin CVE-2020-8835 

# 下次记得修改之前，创建自己的分支
git branch test
git checkout test

##### 为了和上游保持同步
git checkout master
# 因为我主分支一直没动，所以fetch之后，下面merger不会冲突。这步很慢，可以在晚上的时候运行
git fetch upstream  # 抓取上游原仓库的更新；
git merge upstream/master # 合并upstream/master到当前分支
git push origin master
```

<br>

### 编译内核

基本编译如下。[Kernel Build System](https://www.kernel.org/doc/html/latest/kbuild/index.html)还是不要看了，待万不得已的时候再看。

```shell
# 编译内核：O=...,指定kbuild的output；
make mrproper # 保持干净源码
make defconfig O=../linux_image/5.6 # 生成默认配置到./config中
make kvmconfig O=../linux_image/5.6 # Enable additional options for kvm guest kernel support
make O=../linux_image/5.6
```

很多内核参数，我不知道。需要的时候，去搜特定的参数功能吧。这里开始积攒我用到过的参数。

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

<br>

## 制作initramfs文件系统

我是看到[0x04-pwn2own-ebpf-jmp32-cve-2020-8835](https://github.com/rtfingc/cve-repo/tree/master/0x04-pwn2own-ebpf-jmp32-cve-2020-8835)。这样只要有一个人搭建漏洞环境，其他人直接运行就好。感觉很方便。

对于上面仓库中initramfs制作过程的疑惑，我提交了一个issue：[initramfs.cpio中的init可以为空吗](https://github.com/rtfingc/cve-repo/issues/1)

<br>

### initrd介绍

参考： [boot loader 与 kernel 加载](http://cn.linux.vbird.org/linux_basic/0510osloader_1.php#startup_loader) 

> 当启动时无法挂载根目录的情况下，一定需要 initrd。
>
> 如果你的 Linux 是安装在 IDE 介面的磁碟上，并且使用默认的 ext2/ext3 文件系统， 那么不需要 initrd 也能够顺利的启动进入 Linux 的！

万一遇到根文件系统在一个硬盘上。而内核没有读取这个硬盘的驱动。而硬盘的驱动存储在硬盘中的根文件系统中。这样便产生死锁。

boot loader 可以加载kernel 与initrd ，然后在内存中让initrd 解压缩成为根目录， kernel 就能够借此加载适当的驱动程序，并挂载实际的根目录文件系统， 就能够开始后续的正常启动流程。

我们也可以使用cpio查看当前系统中/boot/initrd.img。

<br>

### initramfs文件系统制作

我们借助busybox制作。但是busybox是一些程序的集合，没法填充成完整的文件系统。所以我们还需要手动复制其他文件。

<font color=red>我不知道咋整，从网上东看看，西瞅瞅，如下设置</font>。

**整体内容填充**。


```shell
# 下载busybox
curl https://busybox.net/downloads/busybox-1.33.1.tar.bz2 | tar xjf -
cd busybox-1.33.1

# 编译安装busybox
mkdir -pv obj/busybox-x86
make O=obj/busybox-x86 defconfig
cd obj/busybox-x86
ls -alh .config
vim .config # 修改添加静态链接： CONFIG_STATIC=y #
make -j4
make install # install在_install目录

# 查看_install里面内容：有三个目录，一个文件
# 里面的内容全部是busybox的软连接。

# 跳出到外面，制作initramfs
mkdir initramfs
mkdir -pv {bin,sbin,dev,etc,proc,sys,usr}
mkdir -pv {etc/init.d,usr/{bin,sbin}}
cp -a ../busybox-1.33.1/obj/busybox-x86/_install/* initramfs
sudo cp -a /dev/{null,console,tty1,tty2,tty3,tty4} dev
```

鸟哥中 [boot loader 与 kernel 加载](http://cn.linux.vbird.org/linux_basic/0510osloader_1.php#startup_loader) 介绍的内容太陈旧了。陈皓也写过一篇系统启动的文章：[LINUX PID 1 和 SYSTEMD](https://coolshell.cn/articles/17998.html)

我当初学习操作系统的时候，学习的是：[计算机的启动过程](https://blog.csdn.net/sinat_38816924/article/details/95031961)

现在操作系统的启动流程，我不清楚。busybox还来这里搅和一趟。关键的是[busybox文档](https://busybox.net/FAQ.html)，我也没看到详细的描述。

busybox是一个包含[很多程序](https://busybox.net/downloads/BusyBox.html)的套件，它也包含`init`程序。

**下面我们设置下启动选项**。

方式一：自己写

```shell
touch etc/init.d/rcS

vim etc/init.d/rcS 
# 添加下面内容
#!/bin/sh

mount -t proc proc /proc
mount -t sysfs sysfs /sys
################

# rcS需要可执行权限
chmod 774 etc/init.d/rcS
```

方式二：使用busybox自带的内容。

```shell
cp -a ../../busybox-1.33.1/examples/bootfloppy/etc/* etc
```

**或许，我们还应该给文件系统中添加用户等等**。但是这并不容易。

后面，我们使用工具创建文件系统，将会容易很好。

**制作成initrawfs**。

```shell
find . -print0 | cpio --null -ov --format=newc | gzip -9 > initramfs-busybox-x86.cpio.gz
```

<br>

### qemu启动

关于参数，没啥办法，遇到的时候，一个一个到[QEMU documentation](https://www.qemu.org/documentation/)中搜索，或直接google。

```shell
#!/bin/bash

bzImage_dir=$1
cpio_dir=$2

#run vm
#timeout --foreground 600
qemu-system-x86_64 \
    -m 256M \
    -enable-kvm \
    -nographic -kernel $bzImage_dir \
    -append 'root=/dev/ram rw console=ttyS0' \
    -initrd $cpio_dir \
    -smp cores=2,threads=2  \
    -cpu kvm64,+smep,+smap  \
    -pidfile vm.pid
    2>/dev/null
```

```shell
# 文件结构
➜  linux_image tree -L 1                               
.
├── 5.6               # 编译生成的内核
├── 5.6_qemu_cmd.sh   # qemu的启动脚本
└── initramfs         # initramfs

# 启动
./5.6_qemu_cmd.sh ./5.6/arch/x86/boot/bzImage ./initramfs/initramfs-busybox-x86.cpio.gz

# 关闭
kill `cat vm.pid | grep -v '^$'`
# 或者 ctrl + A ，松手，按x
```

<br>

## 使用Debootstrap制作文件系统

主要是修改文件系统+配置共享文件夹

<br>

### 使用Debootstrap制作文件系统 

自行参考：[构建文件系统](https://blog.csdn.net/sinat_38816924/article/details/116520661#t9)

```shell
qemu-img create debian.img 1G
Formatting 'debian.img', fmt=raw size=1073741824
# dd if=/dev/zero of=$RELEASE.img bs=1M seek=$SEEK count=1

mkfs.ext4 debian.img

mkdir mnt
sudo mount -o loop debian.img mnt/
sudo debootstrap buster mnt/ # 我们下载debian 10的根文件系统
sudo umount mnt
rm -rf mnt
```

<br>

### 修改文件系统

这个文件系统非常clear，我们得修改修改。

```shell
# 比较尴尬的是，待会qemu启动的时候，我不知道登录密码
# 所以，我们需要将上面的img挂载起来，chroot进入，修改登录密码
mkdir mnt
sudo mount debian.img mnt/
sudo chroot mnt
passwd # 密码随手起[避免以后忘记，这里记录一下]：111111
exit
sudo umount mnt
rm -rf mnt
```

```shell
# 我们使用qemu登录
#!/bin/bash

bzImage_dir=$1
fs_dir=$2

#run vm
#timeout --foreground 600
qemu-system-x86_64 \
    -m 256M \
    -enable-kvm \
    -nographic -kernel $bzImage_dir \
    -append 'root=/dev/sda rw console=ttyS0' \
    -drive file=$2,format=raw \
    -smp cores=2,threads=2  \
    -cpu kvm64,+smep,+smap  \
    -net nic \
    -net user \
    -pidfile vm.pid \
    2>/dev/null
```

给文件系统添加网络配置，以可以连接外网。

```shell
# 修改网络配置
ip a
printf '\nauto enp0s3\niface enp0s3 inet dhcp\n' | tee -a /etc/network/interfaces
```

```shell
# 添加普通用户
useradd -d /home/dacao -m dacao
passwd dacao
chsh -s /bin/bash dacao
usermod -G sudo dacao
apt install sudo
```

<br>

### 添加共享文件夹

还需要[Qemu虚拟机与宿主机之间文件传输](http://pwn4.fun/2020/05/27/Qemu%E8%99%9A%E6%8B%9F%E6%9C%BA%E4%B8%8E%E5%AE%BF%E4%B8%BB%E6%9C%BA%E4%B9%8B%E9%97%B4%E6%96%87%E4%BB%B6%E4%BC%A0%E8%BE%93/)

```shell
dd if=/dev/zero of=$PWD/share.img bs=1M count=2000
mkfs.ext4 $PWD/share.img
mkdir $PWD/share
```

**但是下面的方法不大灵光。。我不知道为啥**。。

```shell
#!/bin/bash

bzImage_path="../5.6/arch/x86/boot/bzImage"
rfs_image_path="../debian.img"
share_fs_path="../share.img"
share_mnt_path="../share"

read -e -i "$bzImage_path" -p "enter bzImage path : " bzImage_path 
read -e -i "$rfs_image_path" -p "enter root file system image path : " rfs_image_path
read -e -i "$share_fs_path" -p "enter share file system image path : " share_fs_path
read -e -i "$share_mnt_path" -p  "enter the share image mnt path : " share_mnt_path

sudo mount -o loop $share_fs_path $share_mnt_path

read -s -n1 -p "请将主机的文件放到共享文件夹中\n之后\n按任意键继续 ... "

#run vm
#timeout --foreground 600
qemu-system-x86_64 \
    -m 256M \
    -enable-kvm \
    -nographic -kernel $bzImage_path \
    -append 'root=/dev/sda rw console=ttyS0' \
    -drive file=$rfs_image_path,format=raw \
    -drive file=$share_fs_path,if=virtio \
    -smp cores=2,threads=2  \
    -cpu kvm64,+smep,+smap  \
    -net nic \
    -net user \
    -pidfile vm.pid \
    2>/dev/null


sudo umount $share_mnt_path
```

所以，我换用[Documentation/9psetup](https://wiki.qemu.org/Documentation/9psetup) | [qemu中使用 9p virtio](https://blog.csdn.net/gatieme/article/details/82912921)

```shell
# 现在的启动脚本

#!/bin/bash

bzImage_path="../5.6/arch/x86/boot/bzImage"
rfs_image_path="../debian.img"
share_mnt_path="../share"

read -e -i "$bzImage_path" -p "enter bzImage path : " bzImage_path 
read -e -i "$rfs_image_path" -p "enter root file system image path : " rfs_image_path
read -e -i "$share_mnt_path" -p  "enter the share image mnt path : " share_mnt_path


qemu-system-x86_64 \
    -m 256M \
    -enable-kvm \
    -nographic -kernel $bzImage_path \
    -append 'root=/dev/sda rw console=ttyS0' \
    -drive file=$rfs_image_path,format=raw \
    -smp cores=2,threads=2  \
    -cpu kvm64,+smep,+smap  \
    -net nic \
    -net user \
    -fsdev local,security_model=passthrough,id=fsdev0,path=$share_mnt_path \
    -device virtio-9p-pci,fsdev=fsdev0,mount_tag=hostshare \
    -pidfile vm.pid \
    2>/dev/null
```

其中，起到共享目录的配置是这两行。

```shell
-fsdev local,security_model=passthrough,id=fsdev0,path=$share_mnt_path \
-device virtio-9p-pci,fsdev=fsdev0,mount_tag=hostshare \
```

之后，我们进入虚拟机之后，根据mount_tag，将其挂载到适当位置。

```shell
mount -t 9p -o trans=virtio hostshare /home/dacao/host_file/
```

这里还有另一种共享文件的方式：[virtio-fs](https://virtio-fs.gitlab.io/howto-qemu.html) -- 没看明白。。

<br>

## builtroot

[builtroot](https://buildroot.org/)可以根据选择，同时生成bzImage和根文件系统。

这里有个视频的tutorial：[Buildroot Tutorial- Linux Kernel on QEMU Virtual board - Booting Linux and Running Linux Application](https://www.youtube.com/watch?v=oy5PtFhVk5E&list=PLgRTwLMbCnsHGDltAtwHJH1_3HMyU5DUr&index=3&t=224s)

*  Target Architecture (x86_64)
* (111111) Root password | Run a getty (login prompt) after boot
* Kernel version (Custom version) | (4.6) Kernel version ？？
* Kernel configuration (Using an in-tree defconfig file) | (kvm_guest.config) Additional configuration fragment files ？？
* -*- BusyBox
* ext2/3/4 variant (ext4)
* host qemu

我选了这些，不知道对不对。大体是这么操作的。

<br>

## 参考文章
[快速搭建一个Linux内核调试环境](https://de4dcr0w.github.io/%E5%BF%AB%E9%80%9F%E6%90%AD%E5%BB%BA%E4%B8%80%E4%B8%AALinux%E5%86%85%E6%A0%B8%E8%B0%83%E8%AF%95%E7%8E%AF%E5%A2%83.html) -- 这篇文章强调“快”
[用QEMU来调试内核 -- 亲身体验篇](https://freemandealer.github.io/2015/10/04/debug-kernel-with-qemu-2/) -- 这篇文章的“参考”很好