/**
 * 使用clone系统调用
 * UTS Namespace，将主机名和域名隔离
 * IPC Namespace，只有在同一个Namespace下的进程才能相互通信
 * PID Namespace, 该进程的pid为1
 * 添加User Namespace，把容器中的uid和真实系统的uid给映射在一起，而不总是相同
 * 用普通用户执行程序
 */

#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <errno.h>
#include <sys/mount.h>
#include <string.h>

/* 定义一个给 clone 用的栈，栈大小1M */
#define STACK_SIZE (1024*1024)
static char container_stack[STACK_SIZE];

char* const container_args[] = {
    "/bin/bash",
    NULL
};

int pipefd[2];

void set_map(char* file, int inside_id,int outside_id,int len){
    int n=0;
    FILE* mapfd = fopen(file,"w");
    if(mapfd == NULL){
        perror("open file error");
        exit;
    }
    if((n = fprintf(mapfd,"%d %d %d",inside_id,outside_id,len)) <= 0)
        perror("write file error");
    printf("write %s : %d alpha\n",file,n);
    fclose(mapfd);
}

void set_uid_map(pid_t pid,int inside_id,int outside_id,int len){
    char map_rule[256];
    sprintf(map_rule,"/proc/%d/uid_map",pid);
    set_map(map_rule,inside_id,outside_id,len);
}

void set_gid_map(pid_t pid,int inside_id,int outside_id,int len){
    char map_rule[256];
    sprintf(map_rule,"/proc/%d/gid_map",pid);
    set_map(map_rule,inside_id,outside_id,len);
}


int container_main(void* agr){

    /* 等待父进程通知后再往下执行（进程间的同步） */
    char ch;
    close(pipefd[1]);
    read(pipefd[0], &ch, 1);

    printf("Container[%5d] - inside the container!\n",getpid());

    printf("Container: eUID = %ld;  eGID = %ld, UID=%ld, GID=%ld\n",
        (long) geteuid(), (long) getegid(), (long) getuid(), (long) getgid());
    

    sethostname("container",10);
    printf("Container [%5d] - setup hostname!\n", getpid());
    
    // chroot隔离目录
    if(chdir("../../chroot")!=0 || chroot("./")!=0){
        perror("chdir|chroot");
    }
    printf("chroot container itself filesystem\n");

    // 对从父进程复制过来的mount namespace 修改
    if (mount("proc", "/proc", "proc", 0, NULL) !=0 ) {
        perror("proc");
    }
    printf("container mount itself filesystem\n");

    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    const int gid=getgid(), uid=getuid();

    printf("Parent[%5d] - start a container!\n",getpid());

    pipe(pipefd);

    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    // 添加CLONE_NEWUTS，CLONE_NEWIPC,CLONE_NEWPID,CLONE_NEWNS
    int container_pid = clone(container_main,container_stack+STACK_SIZE,
                            CLONE_NEWUTS|CLONE_NEWIPC|CLONE_NEWPID|CLONE_NEWNS|CLONE_NEWUSER|SIGCHLD,NULL);
    
    printf("Parent [%5d] - Container [%5d]!\n", getpid(), container_pid);


    set_uid_map(container_pid, 0, uid, 1);
    set_gid_map(container_pid, 0, gid, 1); 
    printf("Parent [%5d] - user/group mapping done!\n", getpid());

    // close(pipefd[0]);
    /* 通知子进程：子进程停留在read处，保证set uid/gid执行之后，再执行execv */
    close(pipefd[1]);

    waitpid(container_pid,NULL,0);
    printf("Parent[%5d] - container stop!\n",getpid());
    return 0;
}