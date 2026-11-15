import { createContext } from "react";

export const CompanionContext = createContext();

const CompanionContextProvider = (props) => {
  const value = {};

  return (
    <CompanionContext.Provider value={value}>
      {props.children}
    </CompanionContext.Provider>
  );
};

export default CompanionContextProvider;
