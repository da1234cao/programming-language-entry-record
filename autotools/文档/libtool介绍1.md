[toc]

# 前言

来源一：[AUTOTOOLS - John Calcote](https://nostarch.com/autotools.htm) or [AUTOTOOLS – 亚马逊](https://www.amazon.cn/dp/B003WUYEL6/ref=sr_1_1?__mk_zh_CN=亚马逊网站&dchild=1&keywords=autotools&qid=1616146359&sr=8-1)

来源二：[使用 GNU Libtool 创建库](https://blog.csdn.net/qq_27870421/article/details/99699271) 【这是一篇很好的blog】

简单整理下这本书的第六章：building libraries with libtool

简单整理下这本书的第七章：library interface versioning and runtime dynamic linking

书上该章花了很多笔墨来介绍动态库的原理。我知晓一点点这些原理。如果希望了解这些原理，我可能会通过ELF/PE的结构来了解动态库。该章的动态库原理介绍，翻翻就好。

另外，我没有体会到[动态装载](https://zh.wikipedia.org/wiki/%E5%8B%95%E6%85%8B%E8%A3%9D%E8%BC%89)显示调用[动态库](https://zh.wikipedia.org/wiki/%E5%8A%A8%E6%80%81%E9%93%BE%E6%8E%A5%E5%BA%93)的好处，书上动态装载部分代码能运行。运行时加载动态库相关内容，翻翻就好[ltdl & dl]。

这里是一篇以前的blog：[头文件与库的关系](https://blog.csdn.net/sinat_38816924/article/details/108326511)

本章代码见：[jupiter-libtool-ch6-01](../src/chapter6/jupiter-libtool-ch6-01) | [jupiter-libtool-ch7-01](../src/chapter7/jupiter-libtool-ch7-01)

```shell
# 大概的代码结构
➜  jupiter-libtool-ch6-01 git:(master) ✗ tree
.
├── common
│   ├── jupcommon.h
│   ├── Makefile.am
│   └── print.c
├── configure.ac
├── include
│   ├── libjupiter.h
│   └── Makefile.am
├── libjup
│   ├── jup_print.c
│   └── Makefile.am
├── Makefile.am
└── src
    ├── main.c
    └── Makefile.am
```

<br>

# libtool介绍

 Libtool的存在仅出于一个原因 ——为想要以可移植方式创建和访问共享库的开发人员提供标准化的抽象接口。 它抽象了共享库的构建过程和用于在运行时动态加载和访问共享库的编程接口。

首先，让我们看一下Libtool在构建过程中如何提供帮助。Libtool提供了一个脚本(ltmain.sh)， config.status在启用Libtool的项目中使用该脚本。  config.status脚本将configure测试结果和ltmain.sh脚本转换为libtool脚本的自定义版本。然后，您项目的makefile使用此libtool脚本来构建用LTLIBRARIES定义的共享库。libtool脚本实际上只是编译器，链接器和其他工具的精美包装。您应该将ltmain.sh脚本作为最终用户构建系统的一部分分发到分发tarball中。 

libtool脚本将构建系统的作者与在不同平台上构建共享库的细微差别隔离开来。 该脚本接受一组定义明确的选项，并将它们转换为目标平台和工具集上适当的特定于平台和链接器的选项。 因此，维护人员无需担心在每个平台上构建共享库的细节，他只需要了解可用的libtool脚本选项。 这些选项在GNU Libtool手册中有明确规定，本章将介绍其中的许多选项。

在根本不支持共享库的系统上，libtool脚本使用适当的命令和选项来仅构建和链接静态归档库。 此外，使用Libtool时，维护人员不必担心构建共享库和构建静态库之间的差异。 通过在启用Libtool的项目的configure命令行上使用--disable-shared选项，可以在仅静态系统上模拟构建软件包。   此选项使Libtool假定不能在目标系统上构建共享库。

<br>

# libtool使用

Automake内置了对Libtool的支持；Automake软件包 提供LTLIBRARIES，而不是Libtool软件包。  Libtool并不是真正的纯Automake扩展，而是更多的Automake附加软件包，其中Automake为该特定附加软件包提供了必要的基础结构。 没有Libtool，您将无法访问Automake的LTLIBRARIES主要功能，因为使用该主要功能会生成调用libtool构建脚本的生成规则。 【大概是：automake可以使用libtool，但需要libtool的脚本支持。】

Libtool是单独提供的，而不是作为Automake的一部分提供的，因为您可以独立于Automake非常有效地使用Libtool。 如果您想自己尝试使用Libtool，我将为您提供GNU Libtool手册。 前几章介绍了libtool脚本作为独立产品的使用。 这就像修改makefile命令一样简单，以便通过libtool脚本调用编译器，链接器和库管理器，然后根据Libtool的要求修改某些命令行参数。【大概是：libtool也可以单独使用，而不依赖于automake】

这篇博客中给出了libtool的单独使用和结合automake使用：[使用 GNU Libtool 创建库](https://blog.csdn.net/qq_27870421/article/details/99699271) 

<font color=blue>本篇博客仅包含automake与libtool的结合使用</font>。

<br>

## 库的构建

非必要，除了系统提供的动态库，我是不大乐意使用其他动态库。桌面软件，我感觉静态库就挺好。

不使用libtool，使用make构建静态库可以参考：[头文件与库的关系](https://blog.csdn.net/sinat_38816924/article/details/108326511)

如果使用动态库，不同平台创建使用动态库的方式可能不同，此时便需要libtool。

### include目录

我们需要通过头文件引用库。此时需要考虑代码的文件布局。

include目录，应仅包含公共头文件。这些头文件是项目的公开接口。

如果有多个共享库。可以选择整个项目使用一个顶层的include目录。也可以，每个共享库中创建一个单独的include目录。我通常使用以下经验法则来做出决定：如果将库设计为可以一起工作，那么我将使用单个顶级include目录。 另一方面，如果这些库可以有效地独立使用，那么我将在库自己的目录中提供单独的include目录。

最后，include目录的位置不是特别重要。因为头文件的安装目录结构和存在于项目中的目录结构不相同。所以我们最后确保，我们的头文件不要使用相同的名称。[因为最后它们可能被安装在相同的目录中，虽然可以使用 pkginclude避免]

首先，我们在顶层建立一个include目录，并提供一个包的头文件。

```c
// include/libjupiter.h文件

# ifndef LIBJUPITER_H
#define LIBJUPITER_H

int jupiter_print(const char * salutation, const char * name);

#endif
```

为了保证将来这个头文件可以安装到用户的适当位置，还需要一个Makefile.am。

```makefile
# include/Makefile.am文件
# 这个头文件将安装在$(includedir)
include_HEADERS = libjupiter.h
```

<br>

### 库的构建

首先是库代码。这里在头文件引用的时候，使用尖括号而不是双引号。因为在make之后，install之前，生成的脚本会添加查找路径。在install之后，头文件被安装到系统的适当位置，也可以通过PATH环境变量查找到。所以这里使用尖括号是正确的选择。

```c
// libjup/jup_print.c文件

#include <libjupiter.h>
#include <jupcommon.h>

int jupiter_print(const char* name){
    return print_routine(name);
}
```

接着，需要对库代码进行编译生成库，并设置将来安装的位置。一个Makefile.am搞定。【我是越来越喜欢automake了】

```makefile
lib_LTLIBRARIES = libjupiter.la
libjupiter_la_SOURCES = jup_print.c
libjupiter_la_CPPFLAGS = -I../include -I../common
libjupiter_la_LIBADD = ../common/libjupcommon.la
```

<br>

### 顶层configure.ac和Makefile.am的修改

接下来，我们将这些新目录挂接到项目的构建系统中。为此，我们需要修改顶级Makefile.am和configure.ac文件。 

先来修改Makefile.am。

```makefile
SUBDIRS = common include libjup src
```

接着修改configure.ac。

```shell
LT_PREREQ([2.2])
LT_INIT

# AC_PROG_RANLIB

AC_CONFIG_FILES([Makefile
                common/Makefile
                include/Makefile libjup/Makefile
                 src/Makefile])
```

我在comment中注释了AC_PROG_RANLIB宏的使用。 因为Libtool现在正在构建所有项目库，并且Libtool了解库构建过程的所有方面，所以我们不再需要指示Autoconf来确保ranlib 可用。 实际上，如果保留此宏，则在执行autoreconf -i时会收到警告。 

**LT_PREREQ**宏的工作方式与Autoconf的AC_PREREQ宏一样（使用了几行）。 它表示可以正确处理此项目的最早版本的Libtool。 您应该在这两个宏中为参数选择最低的合理值，因为较高的值不必要地将您和您的共同维护者限制为使用最新版本的Autotools。

**LT_INIT**宏为此项目初始化Libtool系统。您可以在传递到LT_INIT宏的参数列表中指定用于启用或禁用静态和共享库的默认值。  LT_INIT接受一个可选的参数：空格分隔的关键字列表。 以下是此列表中允许使用的最重要的关键字，并对其正确用法进行了解释。

1. **dlopen**：使用此选项可以检查dlopen支持。  GNU Libtool手册指出，如果程序包使用-dlopen和-dlpreopen libtool标志，则应使用此选项； 否则，libtool将假定系统不支持dl-opening。 使用dlopen或-dlpreopen标志的原因只有一个：您打算在运行时通过调用项目源代码中的ltdl库来动态加载和导入共享库功能。 此外，除非您打算使用ltdl库（而不是直接使用dl库）来管理运行时动态链接，否则这两个选项几乎没有作用。 因此，仅当您打算使用ltdl库时，才应使用此选项。【我不打算在代码中显示的动态加载库，所以没有使用此选项进行初始化】
2. **disable-fast-install**：此选项更改了LT_INIT的默认行为，以禁用在相关系统上进行快速安装的优化。 之所以存在快速安装的概念，是因为可能需要从构建树中执行已卸载的程序和库（例如，make check）。在某些系统上，安装位置会影响最终链接的二进制映像，因此Libtool必须在执行make install时重新链接这些系统上的程序和库，或者重新链接程序和库以进行make check。  Libtool默认情况下选择重新链接以进行make check，从而允许快速安装原始二进制文件而无需在make安装过程中重新链接。 在运行configure时，通过指定-enable-fast-install，用户可以根据平台支持来覆盖此默认设置。
3. **shared and disable-shared**：这两个选项更改了创建共享库的默认行为。 shared选项的影响是Libtool知道如何创建共享库的所有系统上的默认行为。 用户可以通过在configure命令行上指定--disable shared或--enable-shared来覆盖默认的共享库生成行为。
4. **static and disable-static**：这两个选项更改了创建静态库的默认行为。 静态选项的作用是禁用共享库的所有系统以及启用了共享库的大多数系统上的默认行为。 如果启用了共享库，则用户可以通过在configure命令行上指定--disable-static来覆盖此默认值。  Libtool将始终在没有共享库的系统上生成静态库。 因此，您不能（有效）使用LT_INIT的disable-shared和disable static参数或--disable-shared和--disable-static命令行选项来同时配置。  （但是请注意，您可以同时使用共享和静态LT_INIT选项或--enable-shared和-enable-static命令行选项。）
5. **pic-only and no-pic**：这两个选项更改了创建和使用PIC对象代码的默认行为。 用户可以通过在configure命令行上指定--without-pic或--with-pic来覆盖这些选项设置的默认值。

<br>

### 在源码中使用动态库

我们修改src/main.c，以使用该库。

```c
// src/main.c文件
#include <libjupiter.h>

int main(int argc,char* argv[]){
    return jupiter_print(argv[0]);
}
```

同样，修改src/Makefile.am以可以正确的链接到该库。

```makefile
# src/Makefile.am
bin_PROGRAMS = jupiter
jupiter_SOURCES = main.c

# jupiter_CPPFLAGS = -I$(top_srcdir)/common
jupiter_CPPFLAGS = -I../include
jupiter_LDADD = ../libjup/libjupiter.la

check_SCRIPTS = greptest.sh
TESTS = $(check_SCRIPTS)

greptest.sh:
	echo './jupiter | grep "Hello from .*jupiter!"' > greptest.sh
	chmod +x greptest.sh

CLEANFILES = greptest.sh
```

<br>

## 编译运行

### 编译运行

和之前相似，我们编译运行该程序。

```shell
➜  touch NEWS README AUTHORS ChangeLog
➜  autoreconf -i
➜  ./configure
# ➜  ./configure --enable-silent-rules # 我希望看到一些编译过程，所以不需要silent
➜  make
```

下面是make的输出中重要的几行。后面我们将慢慢分析这些过程。

```shell
➜  jupiter-libtool-ch6-01 git:(master) ✗ make      
make  all-recursive
...
Making all in libjup
make[2]: 进入目录“/home/dacao/exercise/programming-language-entry-record/autotools/src/chapter6/jupiter-libtool-ch6-01/libjup”
/bin/bash ../libtool  --tag=CC   --mode=compile gcc -DHAVE_CONFIG_H -I. -I..  -I../include -I../common   -g -O2 -MT libjupiter_la-jup_print.lo -MD -MP -MF .deps/libjupiter_la-jup_print.Tpo -c -o libjupiter_la-jup_print.lo `test -f 'jup_print.c' || echo './'`jup_print.c
libtool: compile:  gcc -DHAVE_CONFIG_H -I. -I.. -I../include -I../common -g -O2 -MT libjupiter_la-jup_print.lo -MD -MP -MF .deps/libjupiter_la-jup_print.Tpo -c jup_print.c  -fPIC -DPIC -o .libs/libjupiter_la-jup_print.o
libtool: compile:  gcc -DHAVE_CONFIG_H -I. -I.. -I../include -I../common -g -O2 -MT libjupiter_la-jup_print.lo -MD -MP -MF .deps/libjupiter_la-jup_print.Tpo -c jup_print.c -o libjupiter_la-jup_print.o >/dev/null 2>&1
mv -f .deps/libjupiter_la-jup_print.Tpo .deps/libjupiter_la-jup_print.Plo
/bin/bash ../libtool  --tag=CC   --mode=link gcc  -g -O2   -o libjupiter.la -rpath /usr/local/lib libjupiter_la-jup_print.lo ../common/libjupcommon.la -lpthread 
libtool: link: gcc -shared  -fPIC -DPIC  .libs/libjupiter_la-jup_print.o  -Wl,--whole-archive ../common/.libs/libjupcommon.a -Wl,--no-whole-archive  -lpthread  -g -O2   -Wl,-soname -Wl,libjupiter.so.0 -o .libs/libjupiter.so.0.0.0
libtool: link: (cd ".libs" && rm -f "libjupiter.so.0" && ln -s "libjupiter.so.0.0.0" "libjupiter.so.0")
libtool: link: (cd ".libs" && rm -f "libjupiter.so" && ln -s "libjupiter.so.0.0.0" "libjupiter.so")
libtool: link: (cd .libs/libjupiter.lax/libjupcommon.a && ar x "/home/dacao/exercise/programming-language-entry-record/autotools/src/chapter6/jupiter-libtool-ch6-01/libjup/../common/.libs/libjupcommon.a")
libtool: link: ar cr .libs/libjupiter.a  libjupiter_la-jup_print.o  .libs/libjupiter.lax/libjupcommon.a/print.o 
libtool: link: ranlib .libs/libjupiter.a
libtool: link: rm -fr .libs/libjupiter.lax
libtool: link: ( cd ".libs" && rm -f "libjupiter.la" && ln -s "../libjupiter.la" "libjupiter.la" )
make[2]: 离开目录“/home/dacao/exercise/programming-language-entry-record/autotools/src/chapter6/jupiter-libtool-ch6-01/libjup”
...
```

执行生成目标。

```shell
./src/jupiter
Hello from /home/dacao/exercise/programming-language-entry-record/autotools/src/chapter6/jupiter-libtool-ch6-01/src/.libs/jupiter!
```

### 分析编译过程

1. libtool脚本被调用，使用了--mode=compile选项，是建立对象文件的模式。libtool充当标准gcc命令行的经过某种修改的版本的包装脚本；

   -MT,-MD,-MF,-MP这些选项我不是很清楚。gcc文档3.13 Options Controlling the Preprocessor有它们的介绍。

   libjupiter_la-jup_print.lo，实际上也就是一个文本文件，里面记录了建立动态链接库和静态链接库分别所需要的真实文件名称。

   libjupiter_la-jup_print.Plo，里面记录了make规则的依赖文件。

   ```shell
   make[2]: 进入目录“***/libjup”
   /bin/bash ../libtool  --tag=CC   --mode=compile gcc -DHAVE_CONFIG_H -I. -I..  -I../include -I../common   -g -O2 -MT libjupiter_la-jup_print.lo -MD -MP -MF .deps/libjupiter_la-jup_print.Tpo -c -o libjupiter_la-jup_print.lo `test -f 'jup_print.c' || echo './'`jup_print.c
   
   mv -f .deps/libjupiter_la-jup_print.Tpo .deps/libjupiter_la-jup_print.Plo
   ```

2. 下面这两条命令是上面--mode=compile选项导致的。

   对这两个命令行的仔细比较表明，第一个编译器命令正在使用两个附加标志-fPIC和-DPIC。 第一行也似乎将输出文件定向到.libs子目录，而第二行将其保存在当前目录中。 最后，将stdout和stderr输出都重定向到第二行中的/ dev / null。

   有时，您可能会遇到以下情况：源文件在第一次编译时可以正常编译，但是由于与PIC相关的源代码缺陷而在第二次编译中失败。 这类问题很少见，但是当它们出现时可能是真正的痛苦，因为make会因错误而中止构建，但不会提供任何错误消息来解释问题！ 看到这种情况时，只需在make命令行的CFLAGS变量中传递-nosuppress标志，以告诉Libtool不要将输出从第二个编译重定向到/dev/null。

   多年来，这种双重编译功能在Libtool邮件列表上引起了相当大的焦虑。 通常，这是由于缺乏对Libtool尝试执行的操作及其必要性的理解。 使用Libtool的各种configure脚本命令行选项，您可以强制执行单个编译，但是这样做会带来一定的功能损失。

   ```shell
   libtool: compile:  gcc -DHAVE_CONFIG_H -I. -I.. -I../include -I../common -g -O2 -MT libjupiter_la-jup_print.lo -MD -MP -MF .deps/libjupiter_la-jup_print.Tpo -c jup_print.c  -fPIC -DPIC -o .libs/libjupiter_la-jup_print.o
   
   libtool: compile:  gcc -DHAVE_CONFIG_H -I. -I.. -I../include -I../common -g -O2 -MT libjupiter_la-jup_print.lo -MD -MP -MF .deps/libjupiter_la-jup_print.Tpo -c jup_print.c -o libjupiter_la-jup_print.o >/dev/null 2>&1
   ```

3. libtool脚本的link选项。-rpath指定了库的安装位置。生成的库为libjupiter.la。

   ```shell
   /bin/bash ../libtool  --tag=CC   --mode=link gcc  -g -O2   -o libjupiter.la -rpath /usr/local/lib libjupiter_la-jup_print.lo ../common/libjupcommon.la -lpthread 
   ```

4. 这两行是上面link选项导致。分别生成动态库和静态库。

   ```shell
   libtool: link: gcc -shared  -fPIC -DPIC  .libs/libjupiter_la-jup_print.o  -Wl,--whole-archive ../common/.libs/libjupcommon.a -Wl,--no-whole-archive  -lpthread  -g -O2   -Wl,-soname -Wl,libjupiter.so.0 -o .libs/libjupiter.so.0.0.0
   
   libtool: link: ar cr .libs/libjupiter.a  libjupiter_la-jup_print.o  .libs/libjupiter.lax/libjupcommon.a/print.o
   ```

5. 这里是动态库的版本控制。

   ```shell
   libtool: link: (cd ".libs" && rm -f "libjupiter.so.0" && ln -s "libjupiter.so.0.0.0" "libjupiter.so.0")
   libtool: link: (cd ".libs" && rm -f "libjupiter.so" && ln -s "libjupiter.so.0.0.0" "libjupiter.so")
   ```

   我们先介绍下Linux中库的版本控制。也可以参考：[linux共享库的版本控制和使用](http://lovewubo.github.io/shared_library)

   ```shell
   ❶ -rwxr-xr-x ... libname.so.X.Y
   ❷ lrwxrwxrwx ... libname.so.X -> libname.so.X.Y
   ❸ lrwxrwxrwx ... libname.so -> libname.so.X
   ❹ -rw-r--r-- ... libname.a
   ```

   * ❶ X是主版本好，Y是次版本号。 一般规则是，X的更改表示对库ABI的非向后兼容更改，而Y的更改表示对库兼容的向后兼容修改。
   * ❷ libname.so.X条目称为库的共享库名称（soname），实际上是指向库二进制文件的软链接。  soname是使用程序和库在内部引用的格式。 该链接由ldconfig实用程序创建，该实用程序（除其他事项外）确保适当的soname可以找到已安装库的最新次要版本。
   * ❸ 这是仅以.so结尾的软链接，通常指的是具有最高主版本号的soname。
   * ❹ 条目表示库的静态归档形式，在Linux和Solaris系统上具有.a扩展名。

   有时，您会看到共享库后面跟着第三个编号。

   ```shell
   -rwxr-xr-x ... libname.so.X.Y.Z
   ```

   在此示例中，Y.Z实际上只是一个由两部分组成的次要版本号。 次要版本号中的此类附加数字信息有时称为库的补丁程序级别。

   <font color=blue>共享库版本与产品版本没有任何关系</font>。原因如下：共享库上的版本号实际上不是库版本，而是接口版本。 我在这里指的接口是由库提供给用户的应用程序二进制接口，另一个程序员希望调用该接口提供的功能。 在Libtool的版本控制方案中，每个版本由唯一的整数值标识。 如果接口的任何公共可见方面在公共发行版之间更改，则不能再将其视为相同的接口； 因此，它成为一个新接口，由新的整数标识符标识。 接口已更改的库的每个公共发行版都仅获取下一个连续的接口版本号。

   Libtool库的版本信息在libtool命令行上使用-version-info选项指定，如下所示。冒号分隔符，分别表示接口的 current, revision, and age values

   ```shell
   libname_la_LDFLAGS = -version-info 0:0:0
   ```

   * current值表示当前接口版本号。 这是必须声明新的接口版本时更改的值，因为自库的上一次公开发布以来，该接口已以某种公开可见的方式进行了更改。 按照惯例，库中的第一个接口的版本号为零。 考虑一个共享库，自上次公开发行以来，开发人员已在该共享库中向该库公开的功能集添加了新功能。在这个新版本中，接口不能被认为是相同的。 因此，其当前数量必须从零增加到一。
   * age值表示共享库支持的back version的数量。 比如，库中添加了一个新函数，因此此版本的库中提供的接口与先前版本中的接口不同。但是，仍然完全支持以前的版本，因为以前的接口是当前接口的适当子集。 因此，年龄值也应从零增加到一
   * revision值仅表示当前接口的一系列修订。 也就是说，如果在发布之间未对库的接口进行任何公开可见的更改（也许仅对内部函数进行了优化），则库名称应以某种方式更改，即使只是为了区分两个发布。 但是，current值和age值将是相同的，因为从用户的角度来看，界面没有更改。 因此，revision值会增加以反映这是同一接口的新版本的事实。如果其他两个值中的一个或两个都增加了，revision值将保留为零。

   为了简化共享库的发布过程，对于将要公开发布的库的每个新版本，应该逐步遵循Libtool版本控制算法
   1. 从每个新的Libtool库的版本信息0:0:0开始。(如果您只是简单地从传递给libtool脚本的链接器标志列表中省略了version-info选项，则会自动完成此操作。)对于现有库，请从先前公共发行版的版本信息开始。
   2. 如果自上次更新以来，库源代码发生更改，则进行增量修订（c:r:a变为c:r+1:a）。
   3. 如果自上次更新以来已添加，删除或更改了任何导出的功能或数据，请增加current值并将revision设置为0。

   4. 如果自上次公开发布以来已添加任何导出的功能或数据，请增加age。
   5. 如果自上次公开发布以来已删除任何导出的功能或数据，请将age设置为0。

6. libjupiter.la中包含该库(.a和.so)的链接信息。

   ```shell
   libtool: link: ( cd ".libs" && rm -f "libjupiter.la" && ln -s "../libjupiter.la" "libjupiter.la" )
   ```

   