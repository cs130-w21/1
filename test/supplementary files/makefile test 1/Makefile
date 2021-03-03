.DEFAULT: all
all: a.o b.o c.o ddir/d.o
	echo a.o b.o c.o ddir/d.o -> all

# Test explicit rules.
a.o: a.c
	echo a.c -> a.o

# Test implicit rules; don't specify b!


# Test directories.
c.o: cdir/c.c
	echo cdir/c.c -> c.o

ddir/d.o: ddir/d.c
	echo ddir/d.c -> ddir/d.o
