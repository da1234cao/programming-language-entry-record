#include <stdio.h>
#include <stdlib.h>

#include "list.h"

struct person
{
    int age;
    struct list_head list;
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

    // list_for_each_entry(p, &person1.list,list){
    //     if(p->age == 30){
    //         list_del(&p->list);
    //         break;
    //     }
    // }

    // list_for_each_entry(p, &person1.list,list){
    //     // 如果单线程这样没问题
    //     if(p->age == 30){
    //         struct person *tmp = list_next_entry(p, list);
    //         list_del(&p->list);
    //         p = tmp;
    //     }
    // }

    struct person *n;
    list_for_each_entry_safe(p,n, &person1.list,list){
        if(p->age == 30){
            list_del(&p->list);
            free(p);
        }
    }

    list_for_each_entry(p, &person1.list,list){
        printf("age = %d\n",p->age);
    }

    return 0;
}