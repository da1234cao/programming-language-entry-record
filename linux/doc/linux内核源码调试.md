
## 编译调试版的linux内核的时候，选中修改以下参数。

```shell
make menuconfig

Kernel hacking  --->
    [*] Kernel debugging
    Compile-time checks and compiler options  --->
        [*] Compile the kernel with debug info
        [*]   Provide GDB scripts for kernel debugging

Processor type and features ---->
    [] Randomize the address of the kernel image (KASLR)

make -j$(nproc)
```

```shell
make defconfig
make kvmconfig

CONFIG_DEBUG_KERNEL=y
CONFIG_DEBUG_INFO=y
CONFIG_GDB_SCRIPTS=y
CONFIG_RANDOMIZE_BASE=n

CONFIG_KCOV=y

CONFIG_KASAN=y
CONFIG_KASAN_INLINE=y

make olddefconfig
```

## qemu启动内核

参数说明：
-kernel ./bzImage： 指定启用的内核镜像；
-initrd ./rootfs.img：指定启动的内存文件系统；
-append "nokaslr console=ttyS0" ： 附加参数，其中 nokaslr 参数必须添加进来，防止内核起始地址随机化，这样会导致 gdb 断点不能命中；参数说明可以参见这里。
-s ：监听在 gdb 1234 端口；
-S ：表示启动后就挂起，等待 gdb 连接；
-nographic：不启动图形界面，调试信息输出到终端与参数 console=ttyS0 组合使用；


## GDB调试

```shell
$ gdb 
(gdb) file vmlinux           # vmlinux 位于目录 编译生成内核的目录 中
(gdb) target remote :1234    # 远程调试
(gdb) break start_kernel     # Linux 的内核入口函数
(gdb) c   	
```