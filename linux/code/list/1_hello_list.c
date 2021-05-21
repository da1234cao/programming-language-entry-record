#include <stdio.h>
#include <stdlib.h>

#include "list.h"

struct person
{
    struct list_head list;
    int age;
};

int main(int argc,char **argv)
{
    int i;
    struct person *p;
    struct person person1;
    struct list_head *pos;

    INIT_LIST_HEAD(&person1.list);

    for (i = 0;i < 5;i++) {
        p = (struct person *)malloc(sizeof(struct person ));
        p->age=i*10;
        list_add(&p->list,&person1.list);
    }

    list_for_each(pos, &person1.list) {
        printf("age = %d\n",((struct person *)pos)->age);
    }

    return 0;
}

WRITE_ONCE(list->next, list);
#define WRITE_ONCE(x, val) 
({	
    // 定义一个联合体，并创建一个联合体变量，并给其赋值
	union { 
        typeof(x) __val; 
        char __c[1]; 
    } __u = { .__val = (__force typeof(x)) (val) }; 

	__write_once_size(&(x), __u.__c, sizeof(x));	
	__u.__val;					
})


static __always_inline void __write_once_size(volatile void *p, void *res, int size)
{
	switch (size) {
	case 1: *(volatile __u8 *)p = *(__u8 *)res; break;
	case 2: *(volatile __u16 *)p = *(__u16 *)res; break;
	case 4: *(volatile __u32 *)p = *(__u32 *)res; break;
	case 8: *(volatile __u64 *)p = *(__u64 *)res; break;
	default:
		barrier();
		__builtin_memcpy((void *)p, (const void *)res, size);
		barrier();
	}
}