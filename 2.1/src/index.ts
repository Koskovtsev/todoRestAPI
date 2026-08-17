console.log(`hi`);

function getFirstWord(a: string): number {
    return a.split(/ +/)[0]?.length ?? 0;
}

function getUserNamings(a: { name: string, surname: string }) {
    return {
        fullname: a.name + " " + a.surname,
        initials: a.name[0] + "." + a.surname[0]
    };
}

function getAllProductNames(a: { products: [{ name: string }] }) {
    return a?.products?.map(prod => prod?.name) || [];
}

abstract class Pet {
    petName: string;
    constructor(name: string) {
        this.petName = name;
    }
    name(): string {
        return this.petName;
    };
}

class Cat extends Pet {
    isFast: boolean;
    readonly type = 'cat';
    constructor(name: string, isFast: boolean) {
        super(name);
        this.isFast = isFast;
    }
}

class Dog extends Pet {
    veight: number;
    readonly type = 'dog';
    constructor(name: string, veight: number) {
        super(name);
        this.veight = veight;
    }
}
// easy way is using 'as' keyword
// hard way is ?...
type Person = {
    name: () => string,
    type?: Cat['type'] | Dog['type'],
    cuteness?: number,
    coolness?: number,
}
function personHey(a: Person) {
    return "hey! i'm " + a.name();
}
personHey({ name: () => "roma", cuteness: 100 })
personHey({ name: () => "vasya", coolness: 100 })


function petHey(abstractPet: Cat | Dog) {
    return "hey! i'm " + abstractPet.name();
}
let a = new Cat("myavchik", true)
let b = new Dog("gavchik", 333)
petHey(a);
petHey(b);

function hey(a: Person) {
    return "hey! i'm " + a.name()
        + (a.type === "cat" ? ("cuteness: " + a.cuteness) : ("coolness: " + a.coolness))
}
hey({ name: () => "roma", type: "cat", cuteness: 100 })
hey({ name: () => "vasya", type: "dog", coolness: 100 })

// google for Record type
function stringEntries(a: unknown[] | Record<string, unknown>) {
    return Array.isArray(a) ? a : Object.keys(a)
}

async function world(a: number): Promise<string> {
    return "*".repeat(a)
}
const hello = async () => {
    return await world(10)
}
hello().then(r => console.log(r)).catch(e => console.log("fail"))