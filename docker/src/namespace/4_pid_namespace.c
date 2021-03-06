/**
 * 使用clone系统调用
 * UTS Namespace，将主机名和域名隔离
 * IPC Namespace，只有在同一个Namespace下的进程才能相互通信
 * PID Namespace, 该进程的pid为1
 * 用root执行程序
 */

#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <unistd.h>
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
    printf("Container[%5d] - inside the container!\n",getpid());
    sethostname("container",10);
    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    printf("Parent[%5d] - start a container!\n",getpid());
    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    // 添加CLONE_NEWUTS，CLONE_NEWIPC,CLONE_NEWPID
    int container_pid = clone(container_main,container_stack+STACK_SIZE,
                            CLONE_NEWUTS|CLONE_NEWIPC|CLONE_NEWPID|SIGCHLD,NULL);
    waitpid(container_pid,NULL,0);
    printf("Parent[%5d] - container stop!\n",getpid());
    return 0;
}