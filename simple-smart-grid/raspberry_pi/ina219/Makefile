all: test

test: ina219.so
	g++ -o ./build/profiler ./src/ina219.cc ./profiler.cc


ina219.so:
	mkdir -p ./build
	g++ -o ./build/ina219.so -c ./src/ina219.cc

# install:
# 	cp ./build/ina219.so $(PREFIX)

# uninstall:


clean:
	rm -rf ./build/*
