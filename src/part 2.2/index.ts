import { randomInt } from 'crypto';

interface IpResponse {
    ip: string;
}
//1
async function nodeFetchRequest(): Promise<unknown> {
    const response = await (await fetch('https://api.ipify.org?format=json')).json();
    console.log(response);
    return response;
}
//2
async function getIp(): Promise<void> {
    const data = (await nodeFetchRequest()) as IpResponse;
    console.log(data.ip);
}

getIp();

interface DummyUser {
    firstName: string;
    gender: string;
}

interface IRandomNames {
    1: string,
    2: string,
    3: string,
}
//3
async function getRandomName(): Promise<DummyUser> {
    const randomId = randomInt(1, 100);
    const first = await (await fetch(`https://dummyjson.com/users/${randomId}`)).json() as DummyUser;
    return first;
}
function getRandomNamePromise(): Promise<DummyUser> {
    const randomId = randomInt(1, 100);
    const promiseRandomName = fetch(`https://dummyjson.com/users/${randomId}`).then((response) => response.json() as Promise<DummyUser>);
    return promiseRandomName;
}
async function getThreeNamesPromisaAll(): Promise<IRandomNames> {
    const [name1, name2, name3] = await Promise.all([getRandomName(), getRandomName(), getRandomName()]);
    return { 1: name1.firstName, 2: name2.firstName, 3: name3.firstName };
}

async function getThreeNamesAnyncAwait(): Promise<IRandomNames> {
    const name1 = getRandomName();
    const name2 = getRandomName();
    const name3 = getRandomName();
    return {
        1: (await name1).firstName,
        2: (await name2).firstName,
        3: (await name3).firstName,
    }
}

function getThreeNamesPromisesOnly(): Promise<IRandomNames> {
    const names: Partial<IRandomNames> = {};
    const { promise, resolve, reject } = Promise.withResolvers<IRandomNames>();

    const checkDone = () => {
        if (Object.keys(names).length === 3) {
            resolve(names as IRandomNames);
        }
    };
    getRandomNamePromise().then((name) => {
        names[1] = name.firstName;
        checkDone();
    }).catch(reject);

    getRandomNamePromise().then((name) => {
        names[2] = name.firstName;
        checkDone();
    }).catch(reject);

    getRandomNamePromise().then((name) => {
        names[3] = name.firstName;
        checkDone();
    }).catch(reject);

    return promise;
}

async function multiplyFetch() {
    const namesPromiseAll = await getThreeNamesPromisaAll();
    const namesAsyncParallel = await getThreeNamesAnyncAwait();
    const namesOnlyPromises = await getThreeNamesPromisesOnly();
    console.log(`
    Promise.all:             ${JSON.stringify(namesPromiseAll)}
    Async/Await Parallel:    ${JSON.stringify(namesAsyncParallel)}
    only promises:           ${JSON.stringify(namesOnlyPromises)}
  `);
}

//4 b
async function fastestFetchWoman() {
    let gender = '';
    let womanName = '';
    let count = 0;
    while (gender !== 'female') {
        count++;
        const person = await getRandomName();
        gender = person.gender;
        womanName = person.firstName;
    }
    console.log(`name: ${womanName}, she is a ${gender}. count: ${count}`);
}

function getGender(): Promise<DummyUser> {
    const { resolve, reject, promise } = Promise.withResolvers<DummyUser>();
    getRandomNamePromise().then(resolve).catch(reject);
    return promise;
}
//4 a
function fastestFetchWomanPromise(): Promise<{ name: string, count: number }> {
    const { resolve, reject, promise } = Promise.withResolvers<{ name: string, count: number }>();
    let count = 0;
    function attempt() {
        getGender().then((response) => {
            count++;
            if (response.gender === 'female') {
                console.log(`just promises ==> ==> name: ${response.firstName}, she is a ${response.gender}. count: ${count}`);
                resolve({ name: response.firstName, count: count });
            } else {
                attempt();
            }
        }).catch(reject);
    }
    attempt();
    return promise;
}
//test
// multiplyFetch();
// fastestFetchWoman();
// fastestFetchWomanPromise();
//5
function f1(cb: (value: unknown) => void) {
    fetch('https://api.ipify.org?format=json').then((response) => response.json().then(cb));
}

async function awaitedFunction() {
    return new Promise((resolve) => {
        f1(resolve);
    })
}
//6
async function callBackFunction(callBack: (ip: string) => void) {
    let ip = await awaitedFunction() as string;
    callBack(ip);
}
//test
console.log(`test f1-f2 ${JSON.stringify(await awaitedFunction())}`);
callBackFunction((result) => {
    console.log('Результат з коллбека:', result);
});