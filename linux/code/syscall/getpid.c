#include <syscall.h>
#include <unistd.h>
#include <stdio.h>
#include <sys/types.h>

int main(void) {
    long ID;
    ID = getpid();
    printf ("getpid()=%ld\n", ID);
    return 0;
}