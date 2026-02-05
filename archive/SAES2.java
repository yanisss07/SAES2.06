



public class identification {
    public static void main(String[] args){
        Scanner entree = new Scanner(System.in);
        System.out.println("Entrer un code  d'idendificationde 4 chiffre :");
        int code = entree.nextInt();
        int somme3PremiersChiffres = code / 1000 + (code/100)%10 + (code/10)%10 ; 
        if(somme3PremiersChiffres%7 == code%10){
             System.out.println("***Code correct. Prêt à photocopier.")
        }else{
             System.out.println("***Code incorrect.")

        }
        entree.close()

    }

}



public class identification {
    public static void main(String[] args){
        int [] code = new int [4];
        
        Scanner entree = new Scanner(System.in);
        System.out.println("Entrer un code  d'idendificationde 4 chiffre :");
        String code = entree.nextAr();
        int somme3PremiersChiffres = code[0].nextInt() + code[1].nextInt() + code[2].nextInt() ; 
        if((somme3PremiersChiffres%7).nextLine == code){
             System.out.println("***Code correct. Prêt à photocopier.")
        }else{
             System.out.println("***Code incorrect.")

        }
        entree.close()

    }

}
public class identification {
    public static void main(String[] args){
        Scanner entree = new Scanner(System.in);
        System.out.println("Entrer un code  d'idendificationde 4 chiffre :");
        for(int i = 0 ; i<4 ;i++){
            code[i] = entree.nextInt()
        }

        int somme3PremiersChiffres = code[0] + code[1] + code[2];
        if(somme3PremiersChiffres%7 == code[3]){
             System.out.println("***Code correct. Prêt à photocopier.")
        }else{
             System.out.println("***Code incorrect.")

        }
        entree.close()

    }

}