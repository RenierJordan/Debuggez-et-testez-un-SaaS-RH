/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js";

window.alert = jest.fn()
jest.mock("../app/Store", () => mockStore)


describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock 
  })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))
  describe("When I am on NewBill Page", () => {
    test("Then the newbill stay on screen", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      
      const date = screen.getByTestId("datepicker"); 
      expect(date.value).toBe("");

      const tTc = screen.getByTestId("amount"); 
      expect(tTc.value).toBe(""); 

      const fichierJ = screen.getByTestId("file") 
      expect(fichierJ.value).toBe("")

      const formNewBill = screen.getByTestId("form-new-bill")
      expect(formNewBill).toBeTruthy()//le formulaire vide apparait correctement

      const sendNewBill = jest.fn((e) => e.preventDefault())//creation de fonction pour stopper l'action par défaut
      formNewBill.addEventListener("submit", sendNewBill)
      fireEvent.submit(formNewBill)//simulation de l'évènement
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()//après l'évènement le formulaire reste à l'écran
    })
  })
})

describe("When i download the attached file in the wrong format", () => { 
  test ("Then i stay on the newbill and a message appears", () => {
    
    const html = NewBillUI()          
    document.body.innerHTML = html
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname})
    }
    const newBill = new NewBill({ 
      document,
      onNavigate,
      store: null,
      localStorage: window, localStorage,
    })
    const LoadFile = jest.fn((e) => newBill.handleChangeFile(e))
    const fichier = screen.getByTestId("file")
    const testFormat = new File(["c'est un test"],"document.txt", {
    type: "document/txt"
    })
    fichier.addEventListener("change", LoadFile)
    fireEvent.change(fichier, {target: {files: [testFormat]}})
    
    expect(LoadFile).toHaveBeenCalled()
    expect(window.alert).toBeTruthy()
  })
});


describe("When i download the attached file in the correct format", () => { 
  test ("Then the bill is saved", () => {
    
    const html = NewBillUI()          
    document.body.innerHTML = html
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname})
    }
    const newBill = new NewBill({ 
      document,
      onNavigate,
      store: mockStore,
      localStorage: window, localStorage,
    })
    const LoadFile = jest.fn((e) => newBill.handleChangeFile(e))
    const fichier = screen.getByTestId("file")
    const testFormat = new File(["c'est un test"],"test.jpg", {
    type: "image/jpg"
    })
    fichier.addEventListener("change", LoadFile)
    fireEvent.change(fichier, {target: {files: [testFormat]}})
    
    expect(LoadFile).toHaveBeenCalled()
    expect(fichier.files[0]).toBe(testFormat)
    
    const formNewBill = screen.getByTestId("form-new-bill")
    expect(formNewBill).toBeTruthy()

    const sendNewBill = jest.fn((e) => newBill.handleSubmit(e))
    formNewBill.addEventListener('submit', sendNewBill)
    fireEvent.submit(formNewBill)
    expect(sendNewBill).toHaveBeenCalled()
    expect(screen.getByText('Mes notes de frais')).toBeTruthy()
  })
});


//Test d'intégration POST
describe('Given I am a user connected as Employee', () => {
  describe("When I submit the form completed", () => {
     test("Then the bill is created", async() => {

        const html = NewBillUI()
        document.body.innerHTML = html
        
        const onNavigate = (pathname) => {
           document.body.innerHTML = ROUTES({pathname});
        };
//SIMULATION DE LA CONNECTION DE L'EMPLOYEE
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
              type: 'Employee',
              email: "azerty@email.com",
        }))
//SIMULATION DE CREATION DE LA PAGE DE FACTURE
        const newBill = new NewBill({
              document,
              onNavigate,
              store: null,
              localStorage: window.localStorage,
        })

        const validBill = {
              type: "Vol",
              name: "Test Test",
              date: "2023-05-15",
              amount: 500,
              vat: 70,
              pct: 30,
              commentary: "Commentary",
              fileUrl: "../img/0.jpg",
              fileName: "test.jpg",
              status: "pending"
        };

        // Charger les valeurs dans les champs
        screen.getByTestId("expense-type").value = validBill.type;
        screen.getByTestId("expense-name").value = validBill.name;
        screen.getByTestId("datepicker").value = validBill.date;
        screen.getByTestId("amount").value = validBill.amount;
        screen.getByTestId("vat").value = validBill.vat;
        screen.getByTestId("pct").value = validBill.pct;
        screen.getByTestId("commentary").value = validBill.commentary;

        newBill.fileName = validBill.fileName
        newBill.fileUrl = validBill.fileUrl;

        newBill.updateBill = jest.fn();//SIMULATION DE  CLICK
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))//ENVOI DU FORMULAIRE

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form)

        expect(handleSubmit).toHaveBeenCalled()//VERIFICATION DE L ENVOI DU FORMULAIRE
        expect(newBill.updateBill).toHaveBeenCalled()//VERIFIE SI LE FORMULAIRE EST ENVOYER DANS LE STORE
        
     })
     
//test erreur 404
     test('fetches error from an API and fails with 404 error', async () => {//récupère l'erreur d'une API et échoue avec l'erreur 404
      jest.spyOn(mockStore, 'bills').mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error('Erreur 404'));
          },
        };
      });
        jest.spyOn(console, 'error').mockImplementation(() => {})// Prevent Console.error jest error
  
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })
  
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        document.body.innerHTML = `<div id="root"></div>`
        router()
  
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
  
        
        const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})
      
        // Soumettre le formulaire
        const form = screen.getByTestId('form-new-bill')
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        form.addEventListener('submit', handleSubmit)     
        fireEvent.submit(form)
        await new Promise(process.nextTick)
        expect(console.error).toBeCalled()
      })
//test erreur 500
      test('fetches error from an API and fails with 500 error', async () => {//récupère l'erreur d'une API et échoue avec l'erreur 500
        jest.spyOn(mockStore, 'bills').mockImplementationOnce(() => {
          return {
            update: () => {
              return Promise.reject(new Error('Erreur 500'));
            },
          };
        });
          jest.spyOn(console, 'error').mockImplementation(() => {})// Prevent Console.error jest error
    
          Object.defineProperty(window, 'localStorage', { value: localStorageMock })
          Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })
    
          window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
          document.body.innerHTML = `<div id="root"></div>`
          router()
    
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
          }
    
          
          const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})
        
          // Soumettre le formulaire
          const form = screen.getByTestId('form-new-bill')
          const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
          form.addEventListener('submit', handleSubmit)     
          fireEvent.submit(form)
          await new Promise(process.nextTick)
          expect(console.error).toBeCalled()
        })
  })
});

