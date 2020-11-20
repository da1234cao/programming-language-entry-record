package head_first_java;

public class BeerSong {
    public static void main(String[] args) {
        int beerNum = 99;
        String word = "bottles";

        while(beerNum > 0){
            if(beerNum == 1)
                word = "bottle";
            
            System.out.println(beerNum + " " + word + " of beer on the wall");
            System.out.println(beerNum + " " + word + " of beer.");
            System.out.println("Take one down.");
            System.out.println("Pass it around.");
            System.out.println(); // 加一个空行
            beerNum = beerNum - 1;

            if(beerNum == 0){
                System.out.println("No more bottles if beer on the wall");
                break;
            }
        }
    }
}
