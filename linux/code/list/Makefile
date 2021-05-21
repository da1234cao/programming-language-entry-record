# LINUX_HEADER_PATH = /usr/src/linux-headers-5.4.0-73
# CFLAGS=-I$(LINUX_HEADER_PATH)/include -g -v

PROGS =	1_hello_list 2_hello_list_error 3_hello_list_error_fix 4_list_for_each_entry 5_hello_list_del

all: $(PROGS)

%: %.c
	$(CC) $@.c -o $@

clean:
	rm -f $(PROGS) *.o