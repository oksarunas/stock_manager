// src/components/christmas/Snowflakes.tsx
import React, { useEffect, useState } from "react";
import "./Snowflakes.css"; // Use the relative path for your CSS file

const Snowflakes = () => {
  const [snowflakes, setSnowflakes] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const generateSnowflakes = () => {
      const flakes = Array.from({ length: 50 }).map((_, index) => (
        <div
          key={index}
          className="snowflake"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDuration: `${Math.random() * 10 + 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            fontSize: `${Math.random() * 10 + 10}px`,
          }}
        >
          ❄
        </div>
      ));
      setSnowflakes(flakes);
    };

    generateSnowflakes();
  }, []);

  return <>{snowflakes}</>;
};

export default Snowflakes;
