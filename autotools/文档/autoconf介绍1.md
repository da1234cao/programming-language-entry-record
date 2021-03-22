[toc]

## 前言

来源：[AUTOTOOLS - John Calcote](https://nostarch.com/autotools.htm) or [AUTOTOOLS – 亚马逊](https://www.amazon.cn/dp/B003WUYEL6/ref=sr_1_1?__mk_zh_CN=亚马逊网站&dchild=1&keywords=autotools&qid=1616146359&sr=8-1)

这里简单整理下这本书的第三章：configure your project with autoconf

书中介绍，循序渐进。

第一步：介绍了autoconf和M4宏，并整体运行了一遍，介绍了相关脚本的调用顺序和文件作用。

第二步：通过autoconf将Makefile中定义为@VARIABLE@的变量替换，并通过VPATH进行远程构建。

第三步：借助autoscan生成configure.ac，并说明文件中的宏含义。

<br>

### 代码的初始结构

[代码仓库](https://github.com/da1234cao/programming-language-entry-record/tree/master/autotools/src/chapter02/jupiter-makefile-ch2)，下面的代码在这基础上，不断修改补充。

```shell
➜  jupiter-makefile-ch2 tree
.
├── Makefile
└── src
    ├── main.c
    └── Makefile
```

<br>

## 了解autoconf的第一步

---

[本节的代码仓库](https://github.com/da1234cao/programming-language-entry-record/tree/master/autotools/src/chapter3/jupiter-autoconf-ch3-01)

这里，我们在初始代码的基础上，添加configure.ac文件。

```shell
➜  jupiter-autoconf-ch3-01 git:(master) ✗ tree                                    
.
├── configure.ac
├── Makefile
└── src
    ├── main.c
    └── Makefile
```

```shell
# configure.ac文件
AC_INIT([Jupiter],[1.0])
AC_OUTPUT
```

<br>

### autoconf

对于autoconf而言，输入是通过宏调用的shell脚本(上面那些宏展开来是shell脚本)。autoconf中使用的宏语言为M4。[configure.ac是autoconf的输入]

宏在与autoconf软件包一起分发的文件中定义。 例如，您可以在Autoconf安装目录（通常为/usr/(local/)share /autoconf）中的autoconf/general.m4文件中找到AC_INIT的定义。AC_OUTPUT在autoconf/status.m4中定义。

> [Autoconf -- wiki](https://zh.wikipedia.org/wiki/Autoconf)
>
> autoconf是一个古老和成熟的产品，如果使用得当，可以使用一个非常简单的接口进行复杂的交叉编译。但是有一些批评指出autoconf使用了过时的技术，因而遗留了很多限制。autoconf无法为Xcode与Visual Studio制作项目文件，其脚本通常大且复杂，因此增加了Debug的难度。Autoconf所使用的M4对于一些开发者来说是陌生的，因此他们需要专门学习[6]。一些开发者并不遵循配置脚本的一些习惯约定[7]。因此一些自由软件开发者开始使用其他软件代替autoconf，KDE于KDE 4起开始使用CMake[8]，Scribus同样开始使用CMake[8]。

调用M4宏，需要满足一些规则

* 以方括号确保参数扩展
* 以逗号分隔的参数列表
* 左括号都必须紧跟其定义中的宏名称，并且中间没有空格
* 如果未传递任何参数，则也可以省略括号
* 多余参数将被忽略

通常，阅读那些宏定义的代码，令人极度不愉快。M4的广泛使用对那些试图理解Autoconf的人造成了相当大的挫败感。幸运的是，能够有效使用Autoconf通常不需要深入了解宏的内部工作原理。

<br>

### 执行

运行autoconf很简单：只需在configure.ac文件所在的目录中执行它即可。 虽然我可以在本章的每个示例中做到这一点，但我将使用autoreconf程序代替autoconf程序，因为运行autoreconf与运行autoconf具有完全相同的效果，只是当您使用autoreconf也会做正确的事情 开始向您的构建系统添加Automake和Libtool功能。 也就是说，它将根据configure.ac文件的内容以正确的顺序执行所有Autotools。

```shell
✗ autoreconf
✗ autoreconf
✗ ls -1p
autom4te.cache/
configure
configure.ac
Makefile
src/
```

我们注意到，autoconf创建一个名为autom4te.cache的目录。 这是autom4te缓存目录。 在连续执行Autotools工具链中的实用程序期间，此缓存可加快对configure.ac的访问。

**configure和configure.ac实质上是相同的文件**，只是将configure.ac中所有宏都已完全展开。 欢迎您看一下configure，不要感到惊讶\^_\^。 通过M4宏扩展，configure.ac文件已转换为包含数千行复杂的Bourne Shell脚本的文本文件。

接下来，我们执行configure文件。

```shell
✗ ./configure
configure: creating ./config.status
✗ tree -L 1
.
├── autom4te.cache
├── config.log
├── config.status
├── configure
├── configure.ac
├── Makefile
└── src
```

configre脚本有三个功能：

* 执行请求的检查。 [检查结果以某种方式写入config.status中]
* 生成然后调用config.status。[config.status从模板（Makefile.in，config.h.in等）生成文件]
* 还会创建一个名为config.log的日志文件:

[上面功能可以看到，configure生成了config.status，然后调用config.status，省去config.status可以好？]

为什么不configure仅执行它写入config.status的代码，而不是麻烦立即生成第二个脚本，而只是立即调用它呢？ 有几个很好的理由。 首先，执行检查和生成文件的操作在概念上是不同的，并且在概念上不同的操作与单独的make目标相关联时，make的效果最佳。 第二个原因是，您可以分别执行config.status以从其相应的模板文件重新生成输出文件，从而节省了执行那些冗长的检查所需的时间。 最后，编写config.status来记住最初在configure命令行上使用的参数。 因此，当make检测到需要更新构建系统时，它可以使用最初指定的命令行选项调用config.status重新执行配置。

<br>

## 了解autoconf的第二步

---

[本节的仓库代码](https://github.com/da1234cao/programming-language-entry-record/tree/master/autotools/src/chapter3/jupiter-autoconf-ch3-02)

现在我们给configure.ac中，添加一些实质内容。

```shell
# configure.ac
AC_INIT([Jupiter],[1.0])
AC_CONFIG_FILES([Makefile src/Makefile])
AC_OUTPUT
```

没错，相较于上一节的代码，多了一行。

此行代码假定存在用于Makefile和src/Makefile的模板，分别称为Makefile.in和src/Makefile.in

**这些模板文件看起来与它们的Makefile副本完全相同，但有一个例外：使用@VARIABLE@语法**。

**autoconf替换文本中所有都使用@VARIABLE@语法标记的变量**。

像下面这样修改Makefile为Makefile.in，详细见代码仓库。

```makefile
# @configure_input@

# package-specific substitution variables
package = @PACKAGE_NAME@
version = @PACKAGE_VERSION@
tarname = @PACKAGE_TARNAME@
distdir = $(tarname)-$(version)

# prefix-specific substitution variables
prefix      ?= @prefix@
exec_prefix = @exec_prefix@
bindir      = @bindir@

# VPATH-specific substitution variables
srcdir		= @srcdir@
VPATH		= @srcdir@
```

现在可以执行autoreconf，然后执行configure和make，以构建项目。

这个简单的三行configure.ac文件会生成功能完整的configure script。  (autoreconf)、

生成的configure script将运行各种系统检查，并生成config.status脚本，该脚本可以替换此构建系统中[*.in]一组指定模板。

其中，VPATH构建是一种使用Makefile结构（VPATH）在源目录以外的目录中配置和构建项目的方法，详细介绍见：[Makefile目标文件搜索（VPATH和vpath）](http://c.biancheng.net/view/7051.html)

VPATH构建，思考下，很容易明白。在其他目录执行configure。根据模板生成的makefile文件在当前目录。
make 刚生成的makefile文件，由于其中已经定义了VPATH变量。所以很自然的根据VPATH，找到依赖的源码位置，编译出来的内容在当前目录。从而实现，在非源码目录编译project。

<br>

## 了解autoconf的第三步

---

[本节的仓库代码](https://github.com/da1234cao/programming-language-entry-record/tree/master/autotools/src/chapter3/jupiter-autoconf-ch3-03)

此时的代码结构如下

```shell
.
├── autogen.sh
├── autoscan.log
├── configure.ac
├── configure.ac.bak
├── Makefile.in
└── src
    ├── main.c
    └── Makefile.in
```

我们通过autoscan自动生成configure.scan。configure.scan备份一份为configure.ac.bak。然后，修改configure.scan并为configure.ac。避免完全人工实现configure.ac。

```shell
# configure.ac内容
#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.69])
AC_INIT([Jupiter], [1.0], [jupiter-bugs@example.org])
AC_CONFIG_SRCDIR([src/main.c])
AC_CONFIG_HEADERS([config.h])

# Checks for programs.
AC_PROG_CC
AC_PROG_INSTALL

# Checks for libraries.

# Checks for header files.
AC_CHECK_HEADERS([stdlib.h])

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.

AC_CONFIG_FILES([Makefile
                 src/Makefile])
AC_OUTPUT
```

<br>

### autogen.sh

```shell
# autogen.sh
#!/bin/sh
autoreconf --install
automake --add-missing --copy >/dev/null 2>&1
```

configure检查到有install的时候，需要install-sh的shell脚本，原因如下。

Autoconf就是关于可移植性的，不幸的是，Unix安装实用程序并不像它可能的那样可移植。 从一个平台到另一个平台，安装功能的关键部分都足以引起问题，因此Autotools提供了一个名为install-sh的shell脚本（不建议使用的名称：install.sh）。 该脚本充当系统自身安装实用程序的包装，掩盖了不同版本的安装之间的重要差异。

但是我们目前没有在autoconf中使用automake。而install是automake的工作，需要它提供install-sh。
Autoconf不会生成任何makefile构造-只会将变量代入您的Makefile.in模板中。 因此，Autoconf实际上没有理由抱怨缺少installsh脚本。

所以需要上面的autogen.sh。第五章使用automake的时候，直接autoreconf --install就好。

<br>

### configure.ac

1. **AC_PREREQ**：该宏仅定义了可用于成功处理此configure.ac文件的Autoconf的最早版本。GNU Autoconf手册指出AC_PREREQ是在AC_INIT之前可以使用的唯一宏。 这是因为在开始处理任何其他可能依赖于版本的宏之前，请确保已使用足够新版本的Autoconf。

2. **AC_INIT**：顾名思义，AC_INIT宏将初始化Autoconf系统。 这是其原型，如GNU Autoconf手册中所定义：
   它最多接受五个参数（自动扫描仅使用前三个参数生成一个调用）：程序包，版本以及bugreport，tarname和url（可选）。  package参数应作为程序包的名称。 当您执行make dist时，它将最终（以规范形式）作为Automake生成的发行发行版tarball名称的第一部分。

3. **AC_CONFIG_SRCDIR**：该宏是一个健全性检查。 其目的是确保生成的配置脚本知道执行该脚本对应的项目目录位置。该参数可以是您喜欢的任何源文件的路径（相对于项目的配置脚本）。 您应该选择一个项目唯一的项目，以最大程度地减少configure被误认为其他项目的配置文件本身的可能性。 我尝试选择一种代表项目的文件，例如以定义项目的功能命名的源文件。 这样，万一我决定重新组织源代码，就不太可能在文件重命名中丢失它。 但这并不重要，因为autoconf和configure都会告诉您和您的用户是否找不到此文件。

4. **AC_CONFIG_XXXS** [比如：AC_CONFIG_FILES，AC_CONFIG_HEADERS，AC_CONFIG_COMM]

   这几个宏，可以如下格式表示。

   ```shell
   AC_CONFIG_XXXS(tag..., [commands], [init-cmds])
   ```

   这几个宏，tag参数的形式为OUT [：INLIST]，其中INLIST的形式为IN0 [：IN1：...：INn]。 通常，您会看到仅使用一个参数调用这些宏。

   比如，`AC_CONFIG_HEADERS([config.h])`等价于`AC_CONFIG_HEADERS([config.h:config.h.in])`。表示从config.h.in中生成config.h。

   也可以从多个文件中生成一个文件，如下所示。

   ```shell
   AC_CONFIG_HEADERS([config.h:cfg0:cfg1:cfg2])
   ```

5. **AC_CONFIG_COMMANDS**：可以认为AC_CONFIG_COMMANDS,在执行config.status，起作用。

   ```shell
   # 一个configure.ac的测试版本
   AC_INIT([test], [1.0])  
   AC_CONFIG_COMMANDS([abc],  
   　　　　　　　　　[echo "Testing $mypkgname"],  
   　　　　　　　　　[mypkgname=$PACKAGE_NAME])  
   AC_OUTPUT  
   ```

   ```shell
   $ autoreconf
   $ ./configure
   configure: creating ./config.status
   config.status: executing abc commands
   Testing test
   $
   $ ./config.status
   config.status: executing abc commands
   Testing test
   $
   $ ./config.status --help
   'config.status' instantiates files from templates according to the current
   configuration.
   Usage: ./config.status [OPTIONS]... [FILE]...
   ...
   Configuration commands:
   abc
   Report bugs to <bug-autoconf@gnu.org>.
   $
   $ ./config.status abc
   config.status: executing abc commands
   Testing test
   $
   ```

   如你所见，执行configure引起不带命令行选项的config.status被执行。手动执行config.status有相同的效果。在命令行执行config.status并带abc标签，亦是如此。

6. **AC_CONFIG_HEADERS** & **AC_CHECK_HEADERS**

   autoscan扫描之后，configure.ac(configure.scan)中，包含AC_CHECK_HEADERS，表示需要检查头文件是否存在。当包含AC_CHECK_HEADERS，执行autoreconf的时候，会自动调用autoheader。config.h由config.h.in，通过autoheader生成。

   是否包含头文件的判断方式：检查AC_CHECK_HEADERS中包含的头文件，config.h中是否包含。config.h中包含，则检查通过。反之，不通过。

   因为代码中包含的头文件，安装用户的机器中可能没有该头文件。如果运行configure的时候不检查，make编译代码的时候还是会报错。如果必须通过错误来解决问题，那么最好在配置时而不是在编译时这样做。 一般的经验法则是尽早纾困。

<br>

## 总结

总体来说：

0. 将Makefile中，需要替换的部分，通过@VARIABLE@表示
1. 使用autoscan扫描自动生成configure.scan
2. 根据需要修改configure.scan内容，并重命名为configure.ac
3. 之后运行autoreconfig、configure、make、[make install]

这里面比较重要的是理解configure.ac里面宏的含义。

