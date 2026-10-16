import { createBrowserRouter } from "react-router-dom";
import App from '@/App';
import Main from '@/pages/Main';
import Bill from '@/pages/Bill';
import Offer from '@/pages/Offer';
import Error from '@/pages/Error';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { 
        index: true, 
        element: <Main />, 
        handle: { tabTitle: 'tabTitle.main' } 
      },
      { 
        path: '/bill', 
        element: <Bill />, 
        handle: { tabTitle: 'tabTitle.bill' } 
      },
      { 
        path: '/3ds-light', 
        element: <Offer/>, 
        handle: { tabTitle: 'tabTitle.offer' } 
      },
    //   { 
    //     path: 'offer', 
    //     element: <Offer />, 
    //     handle: { tabTitle: 'tabTitle.offer' } 
    //   },
      { 
        path: 'error', 
        element: <Error />, 
        handle: { tabTitle: 'tabTitle.error' } 
      },
      { 
        path: '*', 
        element: <Error />, 
        handle: { tabTitle: 'tabTitle.error' } 
      },
    ],
  },
]);