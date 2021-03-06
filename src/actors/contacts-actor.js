const { start, dispatch, spawn } = require('nact');
const uuid = require('uuid/v4');
const system = start();
const ContactProtocolTypes = require('../messages');
const { GET_CONTACTS, GET_CONTACT, CREATE_CONTACT, UPDATE_CONTACT, REMOVE_CONTACT } = ContactProtocolTypes;

const contactsService = spawn(
  system,
  (state = { contacts:{} }, msg, ctx) => {    
    if(msg.type === GET_CONTACTS) {
        // Return all the contacts as an array
        dispatch(
          ctx.sender, 
          { payload: Object.values(state.contacts), type: SUCCESS }, 
          ctx.self
        );
    } else if (msg.type === CREATE_CONTACT) {
        const newContact = { id: uuid(), ...msg.payload };
        const nextState = { 
          contacts: { ...state.contacts, [newContact.id]: newContact } 
        };
        dispatch(ctx.sender, { type: SUCCESS, payload: newContact });
        return nextState;
    } else {
        // All these message types require an existing contact
        // So check if the contact exists
        const contact = state.contacts[msg.contactId];
        if (contact) {
            switch(msg.type) {
              case GET_CONTACT: {
                dispatch(ctx.sender, { payload: contact, type: SUCCESS });
                break;
              }
              case REMOVE_CONTACT: {
                // Create a new state with the contact value to undefined
                const nextState = { ...state.contacts, [contact.id]: undefined };
                dispatch(ctx.sender, { type: SUCCESS, payload: contact });
                return nextState;                 
              }
              case UPDATE_CONTACT:  {
                // Create a new state with the previous fields of the contact 
                // merged with the updated ones
                const updatedContact = {...contact, ...msg.payload };
                const nextState = { 
                  ...state.contacts,
                  [contact.id]: updatedContact 
                };
                dispatch(ctx.sender, { type: SUCCESS, payload: updatedContact });
                return nextState;                 
              }
            }
        } else {
          // If it does not, dispatch a not found message to the sender          
          dispatch(
            ctx.sender, 
            { type: NOT_FOUND, contactId: msg.contactId }, 
            ctx.self
          );
        }
    }      
    // Return the current state if unchanged.
    return state;
  },
  'contacts'
);

module.exports = contactsService;
