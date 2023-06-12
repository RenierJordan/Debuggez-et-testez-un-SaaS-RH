/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true)  //L'element windowIcon doit avoir pour class: "active-icon"

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => a - b
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

//test handleClickIconEye
describe("When I click on the first eye icon", () => {
  test("Then the modal should open", () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
    const html = BillsUI({ data: bills})
    document.body.innerHTML = html

    const onNavigate = (pathname) => {//navigation vers la route bills
      document.body.innerHTML = ROUTES({ pathname });
    }

    const billsContainer = new Bills({//creation d'une facture
      document,
      onNavigate,
      store: null,
      localStorage: localStorageMock,
    })

    //MOCK de la modale
    $.fn.modal = jest.fn();//affichage de la modale

    //MOCK L'ICÔNE DE CLIC
    const handleClickIconEye = jest.fn(() => {//fonction qui simule un click
      billsContainer.handleClickIconEye;
    });
    const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
    firstEyeIcon.addEventListener("click", handleClickIconEye);//surveil un événement au click sur l'oeil
    fireEvent.click(firstEyeIcon);//click sur l'icone
    expect(handleClickIconEye).toHaveBeenCalled();//vérifie si l'evenement au click a été appeler
    expect($.fn.modal).toHaveBeenCalled();// vérifie si la modale est appeler


  })
})

// test d'integration get bill
describe("When I get bills", () => {
  test("Then it should render bills", async () => {
    const bills = new Bills({//récupération des factures dans le store
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
    const getBills = jest.fn(() => bills.getBills());//simulation du click       
    const value = await getBills();//vérification
    expect(getBills).toHaveBeenCalled();//ON TEST SI LA METHODE EST APPELEE
    expect(value.length).toBe(4);//test si la longeur du tableau est a 4 du store.js
  });
});
