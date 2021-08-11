[toc]
# 前言

`__attribute__`这个关键字在使用上比较复杂，这里暂时记录部分。后期遇到使用它的代码的时候，以实际的实例来不断完善。

# 属性介绍

`__attribute__`是GCC的一个扩展，用于向编译器传递信息。

`__attribute__`的基本信息可以参考：[How to use the __attribute__ keyword in GCC C?](https://stackoverflow.com/questions/4223367/how-to-use-the-attribute-keyword-in-gcc-c)



# 实例展示使用

## `__attribute__((visibility(“default”)))`

C++的标准名称空间[std](https://github.com/gcc-mirror/gcc/blob/fed7c1634e8e50600e20cb97dbfbd74ecbd5ba22/libstdc%2B%2B-v3/include/bits/allocator.h#L54)，使用`__attribute__((visibility(“default”)))`。

```c++
namespace std _GLIBCXX_VISIBILITY(default)

// Macros for visibility attributes.
//   _GLIBCXX_HAVE_ATTRIBUTE_VISIBILITY
//   _GLIBCXX_VISIBILITY
# define _GLIBCXX_HAVE_ATTRIBUTE_VISIBILITY 1

#if _GLIBCXX_HAVE_ATTRIBUTE_VISIBILITY
# define _GLIBCXX_VISIBILITY(V) __attribute__ ((__visibility__ (#V)))
#else
// If this is not supplied by the OS-specific or CPU-specific
// headers included below, it will be defined to an empty default.
# define _GLIBCXX_VISIBILITY(V) _GLIBCXX_PSEUDO_VISIBILITY(V)
#endif
```

参考：[How to use the __attribute__((visibility(“default”)))?](https://stackoverflow.com/questions/52719364/how-to-use-the-attribute-visibilitydefault)

我并没有理解，或许简单来说：该属性，使得符号出现在全局和动态符号表中。

