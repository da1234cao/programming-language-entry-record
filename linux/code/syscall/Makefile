obj-m += myaudit_module.o

LINUX_KER_PATH := /media/dacao/data/linux_image/5.6_debug

all:
	make -C $(LINUX_KER_PATH) M=$(CURDIR) modules

clean:
	make -C $(LINUX_KER_PATH) M=$(CURDIR) clean