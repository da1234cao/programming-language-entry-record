/**
 * 使用clone系统调用
 * int clone(int (*fn)(void *), void *child_stack,
 *                int flags, void *arg, ...);
 */

#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <unistd.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/wait.h>

/* 定义一个给 clone 用的栈，栈大小1M */
#define STACK_SIZE (1024*1024)
static char container_stack[STACK_SIZE];

char* const container_args[] = {
    "/bin/bash",
    NULL
};

int container_main(void* agr){
    printf("Container - inside the container!\n");
    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    printf("Parent - start a container!\n");
    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    int container_pid = clone(container_main,container_stack+STACK_SIZE,SIGCHLD,NULL);
    waitpid(container_pid,NULL,0);
    printf("Parent - container stop!\n");
    return 0;
}