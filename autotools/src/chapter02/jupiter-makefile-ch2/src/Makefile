CFLAGS ?= -g -O0

all:jupiter

jupiter:main.c
	$(CC) $(CFLAGS) -o $@ $<

clean:
	rm jupiter

check:all
	# grep没有匹配到，echo $?,返回的是1；退出
	./jupiter | grep "Hello from .*jupiter"
	@echo "*** ALL TESTS PASSED ***"

install:
	install -d $(DESTDIR)$(bindir)
	install -m 0755 jupiter $(DESTDIR)$(bindir)

uninstall:
	-rm $(DESTDIR)$(bindir)/jupiter

.PHONY:all clean check install uninstall