[toc]

# 摘要

简述计算机组成原理中的I/O设备，理解设备与驱动的关系。

没有介绍设备驱动模型的抽象(我不知道)，给出了参考链接，可自行阅读。

贴出了字符驱动和块设备驱动的示例代码。

<br>

# 背景介绍

## I/O结构

阅读：[计算机组成原理-03-系统总线](https://houbb.github.io/2019/03/28/compute-organization-03-bus-3)| [南桥-wiki](https://zh.wikipedia.org/wiki/%E5%8D%97%E6%A1%A5) | [Ch8-IO系统 --ppt](http://home.ustc.edu.cn/~louwenqi/courseware/Ch8.pdf) | [I/O控制方式](https://www.jianshu.com/p/9f39c992b804)

I/O设备*总的来说*，挂载在总线上。(因为我不知道细节，比如说，两者旁杂着控制器等。但总体看上去，I/O挂载在总线上)

CPU通过指令(软件)来控制I/O硬件。这个软件便是驱动程序。（非常粗糙）

I/O设备有两个重要的属性：端口和内存。

* 设备驱动程序要直接访问外设或其接口卡上的物理电路，通常以寄存器的形式出现访问；外设寄存器也称为I/O端口，通常包括控制寄存器、状态寄存器和数据寄存器三类。（x通过端口控制I/O设备）

* 根据端口的指示，读写设备的内存。I/O内存可以编址或独立编址。

Linux文档中有一篇：[Bus-Independent Device Accesses](https://www.kernel.org/doc/html/latest/driver-api/device-io.html?highlight=outw)，我不是很明白它在说什么。（下面三点，我不清楚）

* 记录I/O资源：[linux下I/O资源管理](https://m.linuxidc.com/Linux/2011-09/43708.htm)
* 管理I/O端口资源：request\_region()、check\_region()、release\_region()
* 管理I/O内存资源：request\_mem\_region()、check\_mem\_region()、release_mem\_region()

<br>

## 设备驱动模型

阅读：[统一设备模型](http://www.wowotech.net/sort/device_model)

关于设备驱动模型的抽象，我不是很明白，可自行参考：[Linux设备模型(1)_基本概念](http://www.wowotech.net/device_model/13.html)

下面的三个示例，包含字符设备驱动和块设备驱动。(填充一些数据结构)

<br>

# 设备驱动Demo

代码来源：[动手实践-编写字符设备驱动程序](https://gitee.com/ljrcore/linuxmooc/tree/master/《Linux内核分析与应用》动手实践源码/9.6 动手实践-编写字符设备驱动程序) 、[工程实践-块设备驱动](https://gitee.com/ljrcore/linuxmooc/tree/master/《Linux内核分析与应用》动手实践源码/9.7工程实践-块设备驱动)

由于没有和实际硬件结合(即缺少驱动代码控制端口，对I/O的内存进行操作)，所以这三个示例驱动程序都比较简单。

但通过这三个驱动demos，简单能感受到“什么是驱动”、“linux中一切皆文件”。

<br>

## 字符设备驱动

参考：[Linux驱动篇(五)--字符设备驱动(一)](https://zhuanlan.zhihu.com/p/137636768)

代码思路：申请设备号-申请一个cdev结构体-向系统添加一个字符设备-注销字符设备

```c
# include <linux/module.h>
# include <linux/fs.h>
# include <linux/uaccess.h>
# include <linux/init.h>
# include <linux/cdev.h>

# define DEMO_NAME "my_demo_dev"

static dev_t dev;
static struct cdev *demo_cdev;
static signed count = 1;


static int demodrv_open(struct inode *inode, struct file *file)
{
	int major = MAJOR(inode->i_rdev);
	int minor = MINOR(inode->i_rdev);

	printk("%s: major=%d, minor=%d\n",__func__,major,minor);

	return 0;
}


static ssize_t demodrv_read(struct file *file, char __user *buf,size_t lbuf,loff_t *ppos)
{
	printk("%s enter\n",__func__);
	
	return 0;
}


static ssize_t demodrv_write(struct file *file, const char __user *buf,size_t count,loff_t *f_pos)
{
	printk("%s enter\n",__func__);
	
	return 0;
}


static const struct file_operations demodrv_fops = {
	.owner = THIS_MODULE,
	.open = demodrv_open,
	.read = demodrv_read,
	.write = demodrv_write
};


static int __init simple_char_init(void)
{
	int ret;

	/**
	 * 向系统动态申请一个未被使用的设备号；
	 * (主设备号用来表示一个特定的驱动程序。次设备号用来表示使用该驱动程序的各设备)
	 * dev:存放返回的设备号
	 * 0:次设备号的起始值
	 * count:次设备号的个数
	 * DEMO_NAME：（设备号标签）
	*/ 
	ret = alloc_chrdev_region(&dev,0,count,DEMO_NAME); 
	if(ret)
	{
		printk("failed to allocate char device region\n");
		return ret;
	}

	/**
	 * 申请一个cdev结构体
	*/
	demo_cdev = cdev_alloc();
	if(!demo_cdev) 
	{
		printk("cdev_alloc failed\n");
		goto unregister_chrdev;
	}

	/**
	 * 初始化cdev:
	 * 	INIT_LIST_HEAD(&cdev->list);
	 *  kobject_init(&cdev->kobj, &ktype_cdev_default);
	 *  cdev->ops = fops; // 设置该驱动的文件操作
	*/
	cdev_init(demo_cdev,&demodrv_fops);

	/**
	 * 向系统添加一个字符设备
	*/
	ret = cdev_add(demo_cdev,dev,count);
	if(ret)
	{
		printk("cdev_add failed\n");
		goto cdev_fail;
	}

	printk("successed register char device: %s\n",DEMO_NAME);
	printk("Major number = %d,minor number = %d\n",MAJOR(dev),MINOR(dev));

	return 0;

cdev_fail:
	cdev_del(demo_cdev);

unregister_chrdev:
	unregister_chrdev_region(dev,count);

	return ret;
} 


static void __exit simple_char_exit(void)
{
	printk("removing device\n");

	if(demo_cdev)
		cdev_del(demo_cdev);

	unregister_chrdev_region(dev,count); // 注销字符设备时，需要释放设备号
}

module_init(simple_char_init);
module_exit(simple_char_exit);

MODULE_LICENSE("GPL");
```

<br>

## 字符设备驱动-misc使用

参考：  [跟着内核学框架-misc子系统](https://www.cnblogs.com/xiaojiang1025/p/6413017.html) | [Linux内核源码学习之kfifo](https://daimajiaoliu.com/daima/4ed6f78689003fc) 

> Linux 中有三大类设备:字符，网络，块设备，每一种设备又细分为很多类，比如字符设备就被预先分为很多种类，并在文件中标记了这些种类都使用了哪个主设备号，但即便如此，硬件千千万，总还是有漏网之鱼，对于这些难以划分类别的字符设备，Linux中使用"混杂"，设备来统一描述，并**分配给他们一个共同的主设备号10，只用此设备号进行区分设备，**，这些设备主要包括随机数发生器，LCD，时钟发生器等。此外，和很多同样是对cdev进行再次封装的子系统一样，**misc也会自动创建设备文件**，免得每次写cdev接口都要使用class_create()和device_create()等。

```c
# include <linux/module.h>
# include <linux/fs.h>
# include <linux/uaccess.h>
# include <linux/init.h>
# include <linux/cdev.h>
//加入misc机制
# include <linux/miscdevice.h>
# include <linux/kfifo.h>

DEFINE_KFIFO(mydemo_fifo,char,64);

//设备名
# define DEMO_NAME "my_demo_dev"

static struct device *mydemodrv_device;

static int demodrv_open(struct inode *inode, struct file *file)
{
	int major = MAJOR(inode->i_rdev);
	int minor = MINOR(inode->i_rdev);

	printk("%s: major=%d, minor=%d\n",__func__,major,minor);

	return 0;
}


static ssize_t demodrv_read(struct file *file, char __user *buf,size_t count,loff_t *ppos)
{
	int actual_readed;
	int ret;

	ret = kfifo_to_user(&mydemo_fifo,buf, count, &actual_readed); // 摘取队列数据至用户空间的函数
	if(ret)
		return -EIO;

	printk("%s,actual_readed=%d,pos=%lld\n",__func__,actual_readed,*ppos);

	return actual_readed;
}


static ssize_t demodrv_write(struct file *file, const char __user *buf,size_t count,loff_t *ppos)
{
	unsigned int actual_write;
	int ret;

	ret = kfifo_from_user(&mydemo_fifo,buf, count, &actual_write);
	if(ret)
		return -EIO;

	printk("%s: actual_write=%d,ppos=%lld\n",__func__,actual_write,*ppos);

	return actual_write;
}


static const struct file_operations demodrv_fops = {
	.owner = THIS_MODULE,
	.open = demodrv_open,
	.read = demodrv_read,
	.write = demodrv_write,
};

static struct miscdevice mydemodrv_misc_device = {
	.minor = MISC_DYNAMIC_MINOR,
	.name = DEMO_NAME,
	.fops = &demodrv_fops,
};

static int __init simple_char_init(void)
{
	int ret;

	/**
	 * 主设备号为10.
	 * 提供次设备号，和文件操作
	*/
	ret = misc_register(&mydemodrv_misc_device);
	if(ret)
	{
		printk("failed register misc device\n");
		return ret;
	}

	mydemodrv_device = mydemodrv_misc_device.this_device;

	printk("successed register char device: %s\n",DEMO_NAME);

	return 0;
} 


static void __exit simple_char_exit(void)
{
	printk("removing device\n");

	misc_deregister(&mydemodrv_misc_device);
}

module_init(simple_char_init);
module_exit(simple_char_exit);

MODULE_LICENSE("GPL");
```

<br>

## 块设备驱动

参考： [Linux驱动 | 解读块设备驱动的重要概念](https://blog.csdn.net/Blazar/article/details/79126617#t20)

创建一个[RAM disk](https://zh.wikipedia.org/wiki/RAM_disk)。RAM disk是通过使用软件将RAM模拟当做硬盘来使用的一种技术。

使用[gendisk](https://elixir.bootlin.com/linux/latest/source/include/linux/genhd.h#L131)结构体来描述通用磁盘。该结构体中包含了对磁盘的操作方式，请求队列(处理)，设备号。

代码思路：填充gendisk结构-将初始化完成的gendisk结构添加到内核中-释放gendisk结构。

```c
#include <linux/fs.h>
#include <linux/module.h>
#include <linux/moduleparam.h>
#include <linux/init.h>
#include <linux/vmalloc.h>
#include <linux/blkdev.h>
#include <linux/genhd.h>
#include <linux/errno.h>
#include <linux/hdreg.h>
#include <linux/version.h>

#define MY_DEVICE_NAME "myramdisk"

/**
 * RAM盘是通过使用软件将RAM模拟当做硬盘来使用的一种技术
*/

static int mybdrv_ma_no, diskmb = 256, disk_size;
static char *ramdisk;
static struct gendisk *my_gd;
static spinlock_t lock;
static unsigned short sector_size = 512;
static struct request_queue *my_request_queue;

module_param_named(size, diskmb, int, 0);
static void my_request(struct request_queue *q)
{
	struct request *rq;
	int size, res = 0;
	char *ptr;
	unsigned nr_sectors, sector;
	pr_info("start handle request\n");

	/**
	 * 从请求队列中获取一个请求。
	 * 在v5中，这个函数同样被删除
	*/
	rq = blk_fetch_request(q);
	while (rq) {
		nr_sectors = blk_rq_cur_sectors(rq); // 当前要传递的sector个数
		sector = blk_rq_pos(rq); // blk_rq_pos():the current sector

		ptr = ramdisk + sector * sector_size;
		size = nr_sectors * sector_size;

		if ((ptr + size) > (ramdisk + disk_size)) {
			pr_err("end of device\n");
			goto done;
		}

		if (rq_data_dir(rq)) { // 处理写请求
			pr_info("writing at sector %d, %u sectors\n",
				sector, nr_sectors);
			memcpy(ptr, bio_data(rq->bio), size);
		} else { // 处理读请求
			pr_info("reading at sector %d, %u sectors\n",
				sector, nr_sectors);
			memcpy(bio_data(rq->bio), ptr, size);
		}
done:
		if (!__blk_end_request_cur(rq, res))
			rq = blk_fetch_request(q);
	}
	pr_info("handle request done\n");
}

static int my_ioctl(struct block_device *bdev, fmode_t mode,
		    unsigned int cmd, unsigned long arg)
{
	long size;
	struct hd_geometry geo;

	pr_info("cmd=%d\n", cmd);

	// 定义了一个io请求：HDIO_GETGEO-get device geometry
	switch (cmd) { 
	case HDIO_GETGEO:
		pr_info("HIT HDIO_GETGEO\n");
		/*
		 * get geometry: we have to fake one...
		 */
		size = disk_size;
		size &= ~0x3f;
		geo.cylinders = size>>6;
		geo.heads = 2;
		geo.sectors = 16;
		geo.start = 4;

		if (copy_to_user((void __user *)arg, &geo, sizeof(geo)))
			return -EFAULT;

		return 0;
	}
	pr_warn("return -ENOTTY\n");

	return -ENOTTY;
}

static const struct block_device_operations mybdrv_fops = {
	.owner = THIS_MODULE,
	.ioctl = my_ioctl,
};

static int __init my_init(void)
{
	disk_size = diskmb * 1024 * 1024;
	spin_lock_init(&lock);

	ramdisk = vmalloc(disk_size);
	if (!ramdisk)
		return -ENOMEM;

	/**
	 * 块设备初始化请求队列，该函数已被删除
	 * https://lore.kernel.org/lkml/20191018093920.6fbc8141@lwn.net/T/
	 * 每一块设备都会有一个队列，当需要对设备操作时，把请求放在队列中
	*/
	my_request_queue = blk_init_queue(my_request, &lock);
	if (!my_request_queue) {
		vfree(ramdisk);
		return -ENOMEM;
	}

	/**
	 * 设置逻辑块的大小：这应该设置为存储设备可以寻址的尽可能低的块大小；默认值512涵盖了大多数硬件。
	*/
	blk_queue_logical_block_size(my_request_queue, sector_size);

	/**
	 * 注册一个新的块设备(号)。
	 * 第一个参数：主设备号。等于0，表示尝试主动申请一个未使用的主设备号。
	 * 第二个参数：设备名
	*/
	mybdrv_ma_no = register_blkdev(0, MY_DEVICE_NAME);
	if (mybdrv_ma_no < 0) {
		pr_err("Failed registering mybdrv, returned %d\n",
		       mybdrv_ma_no);
		vfree(ramdisk);
		return mybdrv_ma_no;
	}

	/**
	 * 分配一个gendisk(通用磁盘的数据结构)
	*/
	my_gd = alloc_disk(16);
	if (!my_gd) {
		unregister_blkdev(mybdrv_ma_no, MY_DEVICE_NAME);
		vfree(ramdisk);
		return -ENOMEM;
	}

	my_gd->major = mybdrv_ma_no; // 填充主设备号
	my_gd->first_minor = 0;      // 次设备号，从0开始
	my_gd->fops = &mybdrv_fops;  // 该设备的操作
	strcpy(my_gd->disk_name, MY_DEVICE_NAME); // 设备名
	my_gd->queue = my_request_queue;   // 设备操作的请求队列
	set_capacity(my_gd, disk_size / sector_size); // 设置容量，以sector_size为单位
	add_disk(my_gd); // 将初始化完成的gendisk结构添加到内核中

	pr_info("device successfully   registered, Major No. = %d\n",
		mybdrv_ma_no);
	pr_info("Capacity of ram disk is: %d MB\n", diskmb);

	return 0;
}

static void __exit my_exit(void)
{
	del_gendisk(my_gd);
	put_disk(my_gd);
	unregister_blkdev(mybdrv_ma_no, MY_DEVICE_NAME);
	pr_info("module successfully unloaded, Major No. = %d\n", mybdrv_ma_no);
	blk_cleanup_queue(my_request_queue);
	vfree(ramdisk); // ramdisk释放磁盘空间
}

module_init(my_init);
module_exit(my_exit);

MODULE_AUTHOR("Benshushu");
MODULE_LICENSE("GPL v2");
```

