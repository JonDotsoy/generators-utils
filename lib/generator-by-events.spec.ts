import { initCallback, generatorByEvents } from "./generator-by-events"

describe('generatorByEvents', () => {

    it('sample', async () => {
        const cb = jest.fn()

        const init: initCallback<number> = (a) => {
            a.push(1);
            a.push(2);
            a.push(3);
            setTimeout(() => {
                a.push(4);
                a.push(5);
                a.push(6);
                a.push(7);
                a.push(8);
                a.push(9);
            }, 300);
            setTimeout(() => {
                a.done()
            }, 400);
            
        }

        for await (const hi of generatorByEvents<number>(init)) {
            cb(hi)
        }

        expect(cb.mock.calls.length).toBe(9)
        expect(cb.mock.calls).toMatchSnapshot()

    })

    it('', async () => {
        const init: initCallback<number> = (a) => {
            a.push(1);
            a.push(2);
            a.push(3);
            setTimeout(() => {
                a.push(4);
                a.push(5);
            }, 300);

            setTimeout(() => {
                a.error(new Error('error'));
                a.push(6);
                a.push(7);
            }, 350);
            
            setTimeout(() => {
                a.done()
            }, 400);
            
        }

        try {
            for await (const hi of generatorByEvents<number>(init)) {
                console.log({ hi })
            }
        } catch (e) {
            console.log({ e })
        }
    })

})
