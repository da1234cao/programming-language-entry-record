[toc]

## 前言

书接前文，我们来看下[《AUTOTOOLS》 - John Calcote](https://nostarch.com/autotools.htm) 的第二章：UNDERSTANDING THE GNUCODING STANDARDS

这一章，通过不断的完善一个project的makefile，将一个项目的编译标准娓娓道来。

<br>

## 正文

1. 创建项目的伊始，我们需要知道：在什么平台上运行项目代码，用户的期望是什么。

   接着，需要给自己的项目起一个名字(狗蛋？)

   > 您可能知道开放源代码软件项目通常具有古怪的名称-它们可能是用某种具有毛茸茸的小动物的名字来命名的，这些动物具有（大约）与软件，某种设备，一项发明，一个拉丁词，一个过去的英雄或一个古老的特征类似的特征。 上帝。 有些名称只是容易上手且易于发音的虚构词或首字母缩写词。 好的项目名称的另一个重要特征是独特性-重要的是，您的项目必须易于与其他项目区分开。 此外，您应确保您的项目名称在任何语言或文化下均没有负面含义。

2. Project的结构。我们这里是最简单的结构。

   从小处开始，并根据需要成长，并随时间而变。

   ```shell
   ➜  jupiter-makefile-ch2 tree
   .
   ├── Makefile
   └── src
       ├── main.c
       └── Makefile
   ```

3. 不断完善makefile：

   * 基本的all 和 clean 目标

   * 创建源分发存档：把源码复制出去，进行打包压缩到。

   * 自动测试发行版：将发行版解压，编译，测试，删除。

   * 安装：install&uninstall，理解prefix和DESTDIR的不同。

     > DESTDIR：
     >
     > 在该安装中，已安装的文件不会直接放置在它们的预期位置，而是会复制到一个临时位置（DESTDIR）。 但是，已安装的文件将保持其相对目录结构，并且不会修改任何嵌入的文件名。
     >
     > 有DESTDIR，用户可以知道软件将安装在何处。它对stow之类的软件也很有用。
     > 确实，如果安装软件的时候考虑使用stwo，给DSESTDIR赋值，比给prefix赋值要好。
     >
     > [stow](https://github.com/da1234cao/dotfiles/blob/main/README.md)，我挺喜欢这个软件的。

<br>

## Makefile构建代码

```shell
➜  jupiter-makefile-ch2 tree
.
├── Makefile
└── src
    ├── main.c
    └── Makefile
```

```makefile
# top-level的makefile
package = jupiter
version = 1.0
tarname = $(package)
distdir = $(tarname)-$(version)

prefix      ?= /usr/local
exec_prefix = $(prefix)
bindir      = $(exec_prefix)/bin
export prefix
export exec_prefix
export bindir

# $(MAKE) 指向当前使用的Make工具。这主要是为了跨平台的兼容性
# $@指代当前目标
# 在 rm 命令前面加了一个小减号的意思就是，也许某些文件出现问题，但不要管，继续做后面的事。

all clean check install uninstall jupiter:
	cd src && $(MAKE) $@

dist:$(distdir).tar.gz

$(distdir).tar.gz:$(distdir)
	tar chof - $(distdir) | gzip -9 -c > $@
	rm -rf $(distdir)

$(distdir):FORCE
	mkdir -p $(distdir)/src
	cp Makefile $(distdir)
	cp src/Makefile $(distdir)/src
	cp src/main.c $(distdir)/src

FORCE:
	-rm $(distdir).tar.gz > /dev/null 2>&1
	-rm -rf $(distdir) > /dev/null 2>&1

distcheck:$(distdir).tar.gz
	gzip -cd $(distdir).tar.gz | tar xvf -
	cd $(distdir) && $(MAKE) all
	cd $(distdir) && $(MAKE) check
	cd $(distdir) && $(MAKE) prefix=$${PWD}/_inst install
	cd $(distdir) && $(MAKE) prefix=$${PWD}/_inst uninstall
	@remaining="`find $${PWD}/$(distdir)/_inst -type f | wc -l`"; \
		if test "$${remaining}" -ne 0; then \
			echo "*** $${remaining} file(s) remaining in stage directory!"; \
			exit 1; \
		fi
	cd $(distdir) && $(MAKE) clean
	rm -rf $(distdir)
	@echo "*** Package $(distdir).tar.gz is ready for distribution." 

.PHONY:FORCE all clean check dist distcheck
```

```makefile
# src/Makefile

CFLAGS ?= -g -O0

all:jupiter

jupiter:main.c
	$(CC) $(CFLAGS) -o $@ $<

clean:
	rm jupiter

check:all
	# grep没有匹配到，echo $?,返回的是1；退出
	./jupiter | grep "Hello from .*jupiter"
	@echo "*** ALL TESTS PASSED ***"

install:
	install -d $(DESTDIR)$(bindir)
	install -m 0755 jupiter $(DESTDIR)$(bindir)

uninstall:
	-rm $(DESTDIR)$(bindir)/jupiter

.PHONY:all clean check install uninstall
```

```c
// main.c
#include <stdio.h>
#include <stdlib.h>

int main(int argc,char* argv[]){
    printf("Hello from %s!\n",argv[0]);
    return 0;
}
```

<br>

## 附录

1. [GNU coding standards](https://www.gnu.org/prep/standards/)

   > GNU编码标准由Richard Stallman和其他GNU Project志愿者编写。 它们的目的是使GNU系统干净，一致且易于安装。  该文档也可以作为编写可移植，健壮和可靠程序的指南。  它着重于用C编写的程序，但是即使您使用另一种编程语言编写，许多规则和原则也很有用。 规则经常以某种方式陈述写作的原因。

2. [Filesystem Hierarchy Standard](https://www.pathname.com/fhs/)

   > 该标准使：
   > •软件可以预测已安装文件和目录的位置
   > •用户可以预测已安装文件和目录的位置。
   >
   > 我们通过以下方式做到上面两点：
   > •为文件系统的每个区域指定指导原则；
   > •指定所需的最小文件和目录；
   > •列举该原则的例外情况；
   > •列举存在历史冲突的特定情况。
   >
   > FHS文档由以下人员使用：
   > •独立软件供应商创建符合FHS的应用程序，并与符合FHS的发行版一起使用；
   > •OS创建者提供符合FHS的系统；
   > •用户了解并维护系统的FHS合规性。
   >
   > FHS文档的范围有限：
   > •本地文件的本地放置是本地问题，因此FHS不会试图篡夺系统管理员。
   > •FHS解决了需要在多方之间协调文件放置的问题，例如本地站点，发行版，应用程序，文档等。

3. [GNU Make Manual](https://www.gnu.org/software/make/manual/) | [跟我一起写Makefile](https://seisman.github.io/how-to-write-makefile/overview.html)

4. [MakeFile实例阅读](https://github.com/google/AFL/blob/master/Makefile)

   本章书中的这个Makefile有个地方写的不好：all target和check target没有依赖关系。

   上面这个链接中在all target依赖关系写的i挺好。即，编译完成，简单的检查测试完成，all目标才完成。

5. 可以看到`DESTDIR`的两种用法都正确：`$(DESTDIR)` 和 `$${DESTDIR}`

   > make 运行时的系统环境变量可以在 make 开始运行时被载入到 Makefile 文件中，但是如果 Makefile
   > 中**已定义了这个变量**，或是这个变量由 make 命令行带入，那么系统的环境变量的值将被覆盖。（如果
   > make 指定了“-e”参数，那么，系统环境变量将覆盖 Makefile 中定义的变量）
   >
   > 上面已定义的变量是用=定义的；
   >
   > ?= 是如果没有被赋值过就赋予等号后面的值；（可以通过环境变量对它赋值）

   `$(DESTDIR)`：Makefile中没有初始化这个变量，通过make命令行[环境变量]带入，对其进行赋值。)_(??)

   `$${DESTDIR}`：直接从make命令行[环境变量]中取该变量的值。