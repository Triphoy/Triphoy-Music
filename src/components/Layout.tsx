import React from "react";
import "./Layout.css"; // Общие стили, можешь менять путь

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <main className="layout">
      {children}
    </main>
  );
};

export default Layout;
