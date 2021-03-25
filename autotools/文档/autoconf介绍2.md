[toc]

# 前言

来源：[AUTOTOOLS - John Calcote](https://nostarch.com/autotools.htm) or [AUTOTOOLS – 亚马逊](https://www.amazon.cn/dp/B003WUYEL6/ref=sr_1_1?__mk_zh_CN=亚马逊网站&dchild=1&keywords=autotools&qid=1616146359&sr=8-1)

这里简单整理下这本书的第四章：MORE FUN WITH AUTOCONF: CONFIGURING USER OPTIONS

本章的相关代码见：[jupiter-autoconf-ch4-01](https://github.com/da1234cao/programming-language-entry-record/tree/master/autotools/src/chapter4/jupiter-autoconf-ch4-01)

摘要：了解autoconf中更多的宏。

<br>

# 正文

## 替代和定义

在本章中，我将讨论Autoconf套件中三个最重要的宏：AC_SUBST和AC_DEFINE，以及后者的双胞胎AC_DEFINE_UNQUOTED。

替换生成文件中的值可为构建过程提供配置信息，而预处理器变量中定义的值可在构建时向编译器以及运行时向配置的程序和库提供配置信息。 因此，完全熟悉AC_SUBST 和 AC_DEFINE 非常值得

1. **AC_SUBST**：您可以使用AC_SUBST扩展变量替换功能，这是Autoconf不可或缺的一部分。 每个与替换变量有关的Autoconf宏最终都会调用此宏，以从现有的shell变量创建替换变量。 它如下表示：

   ```shell
   AC_SUBST(shell_var[, value])
   ```

   * 第一个参数shell_var表示一个shell变量，它将替换入，使用config.status从模板中生成的文件内。
   * 可选的第二个参数是分配给变量的值。 如果未指定，则将使用shell变量的当前值，无论它是继承还是由先前的一些shell代码设置。
   * 替换变量和模板中的变量使用相同的名称。比如，名为my_var的shell变量将成为名为@my_var@的替代变量。

2. **AC_DEFINE**：AC_DEFINE和AC_DEFINE_UNQUOTED宏定义C-preprocessor宏，它们可以是简单的或类似于函数的宏。 这些可以在config.h.in模板中定义（如果使用AC_CONFIG_HEADERS），也可以在Makefile.in模板中的编译器命令行中传递（通过@DEFS@替换变量）。 回想一下，如果您自己不写config.h.in，autoheader将根据对configure.ac文件中这些宏的调用将其写入config.h。

   这两个宏名称实际上代表了四个不同的Autoconf宏。 这是他们的原型： 

   ```shell
   AC_DEFINE(variable, value[, description])
   AC_DEFINE(variable)
   AC_DEFINE_UNQUOTED(variable, value[, description])
   AC_DEFINE_UNQUOTED(variable)
   ```

   AC_DEFINE和AC_DEFINE_UNQUOTED的区别：AC_DEFINE逐字地使用指定的值作为预处理器宏的值；AC_DEFINE_UNQUOTED对value参数执行shell扩展。

   单参数版本仅保证在预处理程序名称空间中定义了宏，而多参数版本则确保使用特定值定义了宏。

   可选的第三个参数description告诉autoheader将此宏的注释添加到config.h.in模板中。

   如果您希望定义不带值的预处理器宏并提供说明，则应使用的多参数版本的宏，但将value参数保留为空。

<br>

## 检查

###  检查编译器

**AC_PROG_CC**：AC_PROG_CC宏可确保用户系统具有有效的C语言编译器。 这是此宏的原型：

```shell
AC_PROG_CC([compiler-search-list])
```

如果您的代码需要特定的C编译器，则可以在此参数中传递空格分隔的程序名称列表。 例如，如果使用AC_PROG_CC（[cc cl gcc]），则宏将扩展为shell代码，该代码按此顺序搜索cc，cl和gcc。 通常，该参数被省略，从而使宏能够找到用户系统上可用的最佳编译器选项。

如果Jupiter目录树中的源文件后缀了.cxx或.C（大写的.C扩展名表示C ++源文件），则自动扫描将插入对AC_PROG_CXX的调用以及对AC_LANG（[C ++  ]）。

<font color=blue>AC_PROG_CC宏还定义了以下Autoconf替换变量</font>：

* @CC@ (full path of compiler)
* @CFLAGS@ (e.g., -g -O2 for gcc)
* @CPPFLAGS@ (empty by default)
* @EXEEXT@ (e.g., .exe)
* @OBJEXT@ (e.g., .o)

<br>

### 检查其他程序

`AC_PROG_ *`宏检查程序是否存在。如果他们找到程序，则会创建一个替换变量。您应该在Makefile.in模板中使用这些替换变量来执行关联的实用程序。

比如install程序。在configure.ac中，包含这一行：

```shell
AC_PROG_INSTALL
```

对应的在Makefile.in中添加如下行：

```makefile
INSTALL = @INSTALL@
INSTALL_DATA = @INSTALL_DATA@
INSTALL_PROGRAM = @INSTALL_PROGRAM@
INSTALL_SCRIPT = @INSTALL_SCRIPT@
...
install:
	$(INSTALL) -d $(DESTDIR)$(bindir)
	$(INSTALL_PROGRAM) -m 0755 jupiter $(DESTDIR)$(bindir)
...
```

@INSTALL@的值显然是找到的安装脚本的路径。  @INSTALL_DATA@的值为\${INSTALL} -m 0644。基于此，您可能会认为@INSTALL_PROGRAM@和@INSTALL_SCRIPT@的值类似于\${INSTALL} -m 0755，但它们不是 。 这些值仅设置为\$ {INSTALL}。

如果程序检查失败，则生成的配置脚本将失败，并显示一条消息，指出找不到所需的实用程序，并且在正确安装之前，该构建程序无法继续进行。

对应的也有AC_CHECK_PROG

```shell
AC_CHECK_PROG(variable, prog-to-check-for, value-iffound,
[value-if-not-found], [path], [reject])
```

* 检查路径中是否存在要检查的程序。 如果找到，则将变量设置为value-if-found，否则设置为value-ifnot-found（如果给定）
* 如果指定了拒绝（作为完整路径），并且与上一步在系统搜索路径中找到的程序相同，请跳过它，然后继续执行系统搜索路径中的下一个匹配程序。
* 如果用户已经在环境中设置了变量，则该变量将保持不变（从而允许用户在运行configure之前通过设置变量来覆盖检查）。

<br>

### 检查库和头文件

Autoconf库选择宏允许生成的配置脚本智能地选择提供必要功能的库，即使这些库在平台之间的命名不同也是如此。 

我们将使用Autoconf提供的AC_SEARCH_LIBS宏，它是基本AC_CHECK_LIB宏的增强版本。   AC_SEARCH_LIBS宏使我们可以在库列表中测试所需的功能。 如果功能在指定的库之一中存在，则将一个适当的命令行选项添加到@LIBS@替换变量，然后在编译器（链接器）命令行的Makefile.in模板中使用该变量。 

这是GNU Autoconf手册中AC_SEARCH_LIBS的正式定义：

```makefile
AC_SEARCH_LIBS(function, search-libs,
[action-if-found], [action-if-not-found], [otherlibraries])
```

如果与库链接导致无法解析的符号，而这些符号可通过与其他库链接来解析，则将这些库作为other-libraries参数，并以空格分隔。

举个例子，在代码中使用pthread库的时候，可以手动田间-lthread，也可以如下操作。

在configure.ac中添加如下一行：

```shell
AC_SEARCH_LIBS([pthread_create],[pthread])
AC_CHECK_HEADERS([pthread.h]) # 建议也加上头文件检查
```

Makefile.in中添加对应的变量。

```makefile
LIBS       = @LIBS@
jupiter:main.c
	$(CC) $(CPPFLAGS) $(CFLAGS) $(DEFS) -o $@ $(srcdir)/main.c $(LIBS)
```

如果检查通过，LIBS变量值被替换为-lthread。

如果在pthreads库中找不到pthread_create，AC_SEARCH_LIBS不会向@LIBS@变量添加任何内容。

如果希望在代码中，使用关于`HAVE_PTHREAD_H`的条件编译，需要在代码中包含config.h的头文件。[HAVE_PTHREAD_H是autoheader，根据AC_CHECK_HEADERS([pthread.h])，生成在config.h中]

```c
#if HAVE_PTHREAD_H
# include <pthread.h>
#endif
```

但是编译的时候，不想手动添加-DHAVE_CONFIG_H参数，可以在Makefile.in中，添加@DEFS@变量。

因为，我们使用了AC_CONFIG_HEADERS，因此config.h.in将包含大多数这些定义，而@DEFS@将仅包含HAVE_CONFIG_H。

如果您选择不使用configure.ac中的AC_CONFIG_HEADERS宏，则@DEFS@将包含由调用AC_DEFINE的所有宏生成的所有定义。

<br>

### 检查类型和结构定义

Autoconf提供了宏，用于确定用户平台上是否存在特定于C99的标准化类型，并在不存在的情况下对其进行定义。例如，您可以添加对AC_TYPE_UINT16_T的调用以配置configure.ac，以确保uint16_t在用户平台上存在。

这是AC_CHECK_TYPES的正式声明：

```shell
AC_CHECK_TYPES(types, [action-if-found], [action-if-notfound],[includes = 'default-includes'])
```

比如想检查代码中使用的结构体，在用户的头文件中是否存在

```shell
AC_CHECK_TYPES([struct doodah], [], [], [
AC_INCLUDES_DEFAULT
#include<doodah.h>
#include<doodahday.h>])
```

<br>

## 支持可选功能和软件包

有时候，编译的时候，会遇到这些选项：` --enablefeature[=yes|no]` 和 `--with-package[=arg] `

它们由这两个宏提供支持：

```shell
AC_ARG_WITH(package, help-string, [action-if-given], [actionif-not-given])
AC_ARG_ENABLE(feature, help-string, [action-if-given],[action-if-not-given])
```

AC_ARG_WITH控制项目对可选外部软件包的使用，而AC_ARG_ENABLE控制对可选软件功能的包含或排除。

下面是一个使用样例：

```shell
# Checks for command line options
AC_ARG_ENABLE([async-exec],
    [AS_HELP_STRING([--disable-async-exec],
        [disable asynchronous execution @<:@default: no@:>@])],
    [async_exec=${enableval}], [async_exec=yes])

if test "x${async_exec}" = xyes; then
    have_pthreads=no
    AC_SEARCH_LIBS([pthread_create], [pthread], [have_pthreads=yes])

    if test "x${have_pthreads}" = xyes; then
        AC_CHECK_HEADERS([pthread.h], [], [have_pthreads=no])
    fi

    if test "x${have_pthreads}" = xno; then
        AC_MSG_WARN([
  ------------------------------------------
   Unable to find pthreads on this system.
   Building a single-threaded version.
  ------------------------------------------])
        async_exec=no
    fi
fi
```

* 默认值是actionif-not-given
* AS_HELP_STRING：该宏的唯一目的是抽象出在各个位置应在帮助文本中嵌入的空格数量
* The sequence @<:@ is the quadrigraph sequence for the open square bracket character, while @:>@ is the quadrigraph for the closed square bracket character。
* 脚本含义：当有这些库和头文件，允许或禁止这些功能都没关系；如果没有库文件，而且开启了功能，把功能关闭，发出警告；到最后仍然是yes，说明有库，有头文件，开启

## 打印消息

1. **AC_MSG_CHECKING**(feature-description)
2. **AC_MSG_RESULT**(result-description)
3. **AC_MSG_NOTICE**(message)
4. **AC_MSG_ERROR**(error-description[, exit-status])
5. **AC_MSG_FAILURE**(error-description[, exit-status])
6. **AC_MSG_WARN**(problem-description)

AC_MSG_CHECKING和AC_MSG_RESULT宏旨在一起使用。  AC_MSG_CHECKING宏打印一行，表明它正在检查特定功能，但在此行的末尾不打印回车符。 一旦在用户机器上找到（或未找到）功能，AC_MSG_RESULT宏将在行尾打印结果，然后返回回车符，以AC_MSG_CHECKING开头的行结束该行。

AC_MSG_NOTICE和AC_MSG_WARN宏只是在屏幕上打印一个字符串。 配置AC_MSG_WARN 的前导文本：WARNING:，而配置AC_MSG_NOTICE的前导文本：configure:。

AC_MSG_ERROR和AC_MSG_FAILURE宏会生成一条错误消息，停止配置过程，并将错误代码返回到Shell。  AC_MSG_ERROR的前导文本已配置：error:。  AC_MSG_FAILURE打印一行，指示发生错误的目录，用户指定的消息，然后打印该行，See 'config.log' for more
details. 。 第二个选项指定要返回到外壳程序的特定状态代码， 预设值是1。

这些宏输出的文本消息将显示到stdout并发送到config.log文件。

<br>

## 输出

**AC_OUTPUT**：最后，我们来到AC_OUTPUT宏，它在configure内扩展为shell代码，该shell代码根据先前的宏扩展中指定的数据生成config.status脚本。 在扩展AC_OUTPUT之前，必须使用所有其他宏，否则它们对您生成的配置脚本意义不大。  （可以在AC_OUTPUT之后将其他Shell脚本放置在configure.ac中，但不会影响config.status执行的配置或文件生成。）

考虑在AC_OUTPUT之后添加shell echo或print语句，以告诉用户如何根据指定的命令行选项配置构建系统。 您还可以使用这些语句来告知用户其他有用的make目标。

比如这样子：

```shell
...
AC_OUTPUT

echo \
"-------------------------------------------------

 ${PACKAGE_NAME} Version ${PACKAGE_VERSION}

 Prefix: '${prefix}'.
 Compiler: '${CC} ${CFLAGS} ${CPPFLAGS}'

 Package features:
   Async Execution: ${async_exec}

 Now type 'make @<:@<target>@:>@'
   where the optional <target> is:
     all                - build all binaries
     install            - install everything

--------------------------------------------------"
```

