package tutorial;

class FreshJuice {
    enum juiceSize{SMALL, MEDIUM , LARGE};
    juiceSize size;
}

public class FreshJuiceTest {
    public static void main(String[] arg) {
        FreshJuice juice = new FreshJuice();
        juice.size = FreshJuice.juiceSize.SMALL; // 类里面的枚举类似可以直接取到？
        System.out.println(juice.size);
    }
}

/**
 * 使用元组
 * 1. 每个编译单元（文件）都只能有一个public类，这表示，每个编译单元都有单一的公共接口，用public类来表现
 * 2. 类里面的静态变量，直接通过类获取，没有通过对象获取，具体原因目前不清楚
 * 3. JAVA的枚举是一种特殊的类。用来表示一组常量，类型是枚举类型。
 */
