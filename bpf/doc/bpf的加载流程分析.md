[toc]

# 前言

我们知道，使用clang/llvm编译生成的target为bpf的elf文件，使用[load_bpf_file函数](https://elixir.bootlin.com/linux/v5.6/source/samples/bpf/bpf_load.c#L659)加载进入内核。

所以，这里，我们需要分析下load_bpf_file函数。

<br>

# elf结构简介

我们首先需要一个bpf程序，并编译该程序。linux的sample提供了一个这样的示例代码：[xdp_monitor_kern.c](https://elixir.bootlin.com/linux/v5.6/source/samples/bpf/xdp_monitor_kern.c)

我们需要linux的源码，有两种方式：[ubuntu获取源码方式](https://blog.csdn.net/sinat_38816924/article/details/115498707) | [linux内核实验环境搭建](https://blog.csdn.net/sinat_38816924/article/details/116571783)

进入到源码目录之后，我们编译sample/bpf中的代码。

```shell
# O指定的是我之前编译好的内核位置。
# 看下sample/bpf/makefile文件，里面没有设置prefix这类变量。所以生成的二进制文件，在源码所在的目录
make -C samples/bpf/ O=../linux_image/5.6_debug

# 查看编译生成的elf文件
➜ file xdp_monitor_kern.o
xdp_monitor_kern.o: ELF 64-bit LSB relocatable, eBPF, version 1 (SYSV), with debug_info, not stripped

# 不用之后，记得删除编译生成的文件
make clean -C samples/bpf/ O=../linux_image/5.6_debug
```

之后，我们可以使用[readelf](https://markrepo.github.io/commands/2018/11/10/readelf/)查看xdp_monitor_kern.o的相关信息。

关于elf的结构，可以参考：[《程序员的自我修养 -- 链接装载与库》](https://www.amazon.cn/dp/B0027VSA7U) 第3章 目标文件里有什么。

图片来源： [计算机那些事(4)——ELF文件结构](http://chuquan.me/2018/05/21/elf-introduce/)

![ELF文件结构](./bpf的加载流程分析.assets/ELF文件结构.png)

另外，需要安装下elf库。

```shell
sudo apt install libelf-dev
```

<br>

# load_bpf_file函数

可以看到load_bpf_file函数，调用[do_load_bpf_file](https://elixir.bootlin.com/linux/v5.6/source/samples/bpf/bpf_load.c#L508)函数。根据[bpf_load.h](https://elixir.bootlin.com/linux/v5.6/source/samples/bpf/bpf_load.h#L41)里面的注释，我们知道这个函数，分为三个部分。

```c
/* parses elf file compiled by llvm .c->.o
 * . parses 'maps' section and creates maps via BPF syscall
 * . parses 'license' section and passes it to syscall
 * . parses elf relocations for BPF maps and adjusts BPF_LD_IMM64 insns by
 *   storing map_fd into insn->imm and marking such insns as BPF_PSEUDO_MAP_FD
 * . loads eBPF programs via BPF syscall
 *
 * One ELF file can contain multiple BPF programs which will be loaded
 * and their FDs stored stored in prog_fd array
 *
 * returns zero on success
 */
int load_bpf_file(char *path); 
int load_bpf_file_fixup_map(const char *path, fixup_map_cb fixup_map); //我们暂时不使用fixup_map，即fixup_map为NULL
```

1. 解析map section，并通过bpf系统调用创建map
2. 解析elf relocation sections。将其作用的重定向段中的insn的imm存储着map的fd，并将该insn标记为BPF_PSEUDO_MAP_FD。
3. 通过bpf系统调用，加载eBPF程序

<br>

## 准备工作

打开elf文件。

```c
	if (elf_version(EV_CURRENT) == EV_NONE)  //elf的version要为1
		return 1;

	fd = open(path, O_RDONLY, 0);
	if (fd < 0)
		return 1;

	elf = elf_begin(fd, ELF_C_READ, NULL); // elf指向elf文件

	if (!elf)
		return 1;

	if (gelf_getehdr(elf, &ehdr) != &ehdr) // 获取elf的header
		return 1;

	/* clear all kprobes */
	i = write_kprobe_events(""); // 将/sys/kernel/debug/tracing/kprobe_events中的内容清空
```

扫描所有的section。

将license的相关内容从license section中取出；将kernel version的相关内容从version section中取出；

所有的map在一个map section中。保存map的数据和map section对应的section标号。

保存符号表的数据。段的类型是符号表时， sh_link的内容“操作系统相关”，(我不知道里面存储的是什么)它用于后面取map的名称。

```c
/* scan over all elf sections to get license and map info */
	for (i = 1; i < ehdr.e_shnum; i++) {

		if (get_sec(elf, i, &ehdr, &shname, &shdr, &data))
			continue;

		if (0) /* helpful for llvm debugging */
			printf("section %d:%s data %p size %zd link %d flags %d\n",
			       i, shname, data->d_buf, data->d_size,
			       shdr.sh_link, (int) shdr.sh_flags);

		if (strcmp(shname, "license") == 0) {
			processed_sec[i] = true;
			memcpy(license, data->d_buf, data->d_size);
		} else if (strcmp(shname, "version") == 0) {
			processed_sec[i] = true;
			if (data->d_size != sizeof(int)) {
				printf("invalid size of version section %zd\n",
				       data->d_size);
				return 1;
			}
			memcpy(&kern_version, data->d_buf, sizeof(int));
		} else if (strcmp(shname, "maps") == 0) {
			int j;

			maps_shndx = i;
			data_maps = data;
			for (j = 0; j < MAX_MAPS; j++)
				map_data[j].fd = -1;
		} else if (shdr.sh_type == SHT_SYMTAB) {
			strtabidx = shdr.sh_link;
			symbols = data;
		}
	}

```

<br>

## 创建map

解析map section，并通过bpf系统调用创建map。

```c
	if (data_maps) {
		// 使用elf中的map section，填充map_data.
		nr_maps = load_elf_maps_section(map_data, maps_shndx,
						elf, symbols, strtabidx);
		if (nr_maps < 0) {
			printf("Error: Failed loading ELF maps (errno:%d):%s\n",
			       nr_maps, strerror(-nr_maps));
			goto done;
		}
		/* 使用系统调用syscall(__NR_bpf, 0, attr, size);，创建各个map */
		/* 此时用户空间可以使用两个全局变量：map_fd,map_data来定位创建的map。 */
		/* 全局变量map_data_count，记录着该程序，创建的map数量 */
		if (load_maps(map_data, nr_maps, fixup_map))
			goto done;
		map_data_count = nr_maps;

		processed_sec[maps_shndx] = true;
	}
```

load_elf_maps_section是一个很漂亮的函数。它使用elf中的map section，填充map_data。

```c
static int load_elf_maps_section(struct bpf_map_data *maps, int maps_shndx,
				 Elf *elf, Elf_Data *symbols, int strtabidx)
{
	int map_sz_elf, map_sz_copy;
	bool validate_zero = false;
	Elf_Data *data_maps;
	int i, nr_maps;
	GElf_Sym *sym;
	Elf_Scn *scn;
	int copy_sz;

	if (maps_shndx < 0)
		return -EINVAL;
	if (!symbols)
		return -EINVAL;

	/* Get data for maps section via elf index */
	scn = elf_getscn(elf, maps_shndx);
	if (scn)
		data_maps = elf_getdata(scn, NULL);
	if (!scn || !data_maps) {
		printf("Failed to get Elf_Data from maps section %d\n",
		       maps_shndx);
		return -EINVAL;
	}

	/* For each map get corrosponding symbol table entry */
	/* 符号表中包含map的符号和其他符号；根据指向的节是不是map的节，判断当前符号，是不是一个map的符号。所有的map在一个节中 */
	/* 最后map节中，每个map对应的符号在sym中 */
	sym = calloc(MAX_MAPS+1, sizeof(GElf_Sym));
	for (i = 0, nr_maps = 0; i < symbols->d_size / sizeof(GElf_Sym); i++) {
		assert(nr_maps < MAX_MAPS+1);
		if (!gelf_getsym(symbols, i, &sym[nr_maps]))
			continue;
		if (sym[nr_maps].st_shndx != maps_shndx)
			continue;
		/* Only increment iif maps section */
		nr_maps++;
	}

	/* Align to map_fd[] order, via sort on offset in sym.st_value */
	/* 根据它们的偏移量进行排序。 */
	qsort(sym, nr_maps, sizeof(GElf_Sym), cmp_symbols);

	/* Keeping compatible with ELF maps section changes
	 * ------------------------------------------------
	 * The program size of struct bpf_load_map_def is known by loader
	 * code, but struct stored in ELF file can be different.
	 *
	 * Unfortunately sym[i].st_size is zero.  To calculate the
	 * struct size stored in the ELF file, assume all struct have
	 * the same size, and simply divide with number of map
	 * symbols.
	 * 
	 * map节中存放着多个map。它们的大小通过对应的符号无法看出。
	 * 如果添加了新的特征，导致无法将elf中的map填充到程序中，则报错EFBIG
	 * 比如，将来使用map添加了新的特征。但是这个程序却被使用在低版本上，导致map无法完全加载，可以EFBIG，
	 * 这个程序，漂亮。
	 */
	map_sz_elf = data_maps->d_size / nr_maps;
	map_sz_copy = sizeof(struct bpf_load_map_def);
	if (map_sz_elf < map_sz_copy) {
		/*
		 * Backward compat, loading older ELF file with
		 * smaller struct, keeping remaining bytes zero.
		 */
		map_sz_copy = map_sz_elf;
	} else if (map_sz_elf > map_sz_copy) {
		/*
		 * Forward compat, loading newer ELF file with larger
		 * struct with unknown features. Assume zero means
		 * feature not used.  Thus, validate rest of struct
		 * data is zero.
		 */
		validate_zero = true;
	}

	/* Memcpy relevant part of ELF maps data to loader maps */
	for (i = 0; i < nr_maps; i++) {
		struct bpf_load_map_def *def;
		unsigned char *addr, *end;
		const char *map_name;
		size_t offset;

		map_name = elf_strptr(elf, strtabidx, sym[i].st_name);
		maps[i].name = strdup(map_name);
		if (!maps[i].name) {
			printf("strdup(%s): %s(%d)\n", map_name,
			       strerror(errno), errno);
			free(sym);
			return -errno;
		}

		/* Symbol value is offset into ELF maps section data area */
		offset = sym[i].st_value;
		def = (struct bpf_load_map_def *)(data_maps->d_buf + offset);
		maps[i].elf_offset = offset;
		memset(&maps[i].def, 0, sizeof(struct bpf_load_map_def));
		memcpy(&maps[i].def, def, map_sz_copy);

		/* Verify no newer features were requested */
		if (validate_zero) {
			addr = (unsigned char *) def + map_sz_copy;
			end  = (unsigned char *) def + map_sz_elf;
			for (; addr < end; addr++) {
				if (*addr != 0) {
					free(sym);
					return -EFBIG;
				}
			}
		}
	}

	free(sym);
	return nr_maps;
}

```

<br>

## 处理所有的重定向section

解析elf relocation sections。将其作用的重定向段中的insn的imm存储着map的fd，并将该insn标记为BPF_PSEUDO_MAP_FD。

```c
	/* process all relo sections, and rewrite bpf insns for maps */
	for (i = 1; i < ehdr.e_shnum; i++) {
		if (processed_sec[i])
			continue;

		if (get_sec(elf, i, &ehdr, &shname, &shdr, &data))
			continue;

		if (shdr.sh_type == SHT_REL) {
			struct bpf_insn *insns;

			/* locate prog sec that need map fixup (relocations) */
			/* 上面通过i遍历出所有的重定位表。sh_info该重定位表所作用的节在节头表中的下标 */
			if (get_sec(elf, shdr.sh_info, &ehdr, &shname_prog,
				    &shdr_prog, &data_prog))
				continue;

			/* 要求通过重定位表找到的代码，需要是程序类型，并且该节在进程空间中可被执行 */
			if (shdr_prog.sh_type != SHT_PROGBITS ||
			    !(shdr_prog.sh_flags & SHF_EXECINSTR))
				continue;

			insns = (struct bpf_insn *) data_prog->d_buf;
			processed_sec[i] = true; /* relo section */
			
			/* 对于重定位的代码，标记为BPF_PSEUDO_MAP_FD；insn中的imm指向map的fd*/
			if (parse_relo_and_apply(data, symbols, &shdr, insns,
						 map_data, nr_maps))
				continue;
		}
	}
```

<br>

## 加载ebpf程序

通过bpf系统调用，加载eBPF程序。

```c
	/* load programs */
	/* 不需要加载的section：version，license，map，relo section*/
	for (i = 1; i < ehdr.e_shnum; i++) {

		if (processed_sec[i])
			continue;

		if (get_sec(elf, i, &ehdr, &shname, &shdr, &data))
			continue;

		if (memcmp(shname, "kprobe/", 7) == 0 ||
		    memcmp(shname, "kretprobe/", 10) == 0 ||
		    memcmp(shname, "tracepoint/", 11) == 0 ||
		    memcmp(shname, "raw_tracepoint/", 15) == 0 ||
		    memcmp(shname, "xdp", 3) == 0 ||
		    memcmp(shname, "perf_event", 10) == 0 ||
		    memcmp(shname, "socket", 6) == 0 ||
		    memcmp(shname, "cgroup/", 7) == 0 ||
		    memcmp(shname, "sockops", 7) == 0 ||
		    memcmp(shname, "sk_skb", 6) == 0 ||
		    memcmp(shname, "sk_msg", 6) == 0) {
			ret = load_and_attach(shname, data->d_buf,
					      data->d_size);
			if (ret != 0)
				goto done;
		}
	}
```

以`SEC("tracepoint/xdp/xdp_redirect")`为例，我们看下加载过程。

```c
...
	/* 最后调用sys_bpf(BPF_PROG_LOAD, attr, size);系统调用，将程序加载进入*/
	fd = bpf_load_program(prog_type, prog, insns_cnt, license, kern_version,
			      bpf_log_buf, BPF_LOG_BUF_SIZE);
...
    	} else if (is_tracepoint) {
		event += 11;

		if (*event == 0) {
			printf("event name cannot be empty\n");
			return -1;
		}
		strcpy(buf, DEBUGFS);
		strcat(buf, "events/");
		strcat(buf, event);
		strcat(buf, "/id");
	}
...
    接下来，从/sys/kernel/debug/tracing/events/xdp/xdp_redirect/id中读取内容
...
    我不知道为什么需要下面这样做。
    efd = sys_perf_event_open(&attr, -1/*pid*/, 0/*cpu*/, -1/*group_fd*/, 0);
	...
    err = ioctl(efd, PERF_EVENT_IOC_ENABLE, 0);
    ...
    err = ioctl(efd, PERF_EVENT_IOC_SET_BPF, fd);
```

<br>

# 参考

[eBPF 程序装载、翻译与运行过程详解](http://tinylab.org/ebpf-part2/)