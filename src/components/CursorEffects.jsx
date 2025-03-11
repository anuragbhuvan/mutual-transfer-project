import { useEffect, useState } from 'react';

const CursorEffects = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => {
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Generate code
    setCode(`document.addEventListener("mousemove", function (e) {
    let cursor = document.querySelector(".cursor-effect");
    if (!cursor) {
        cursor = document.createElement("div");
        cursor.classList.add("cursor-effect");
        document.body.appendChild(cursor);
    }
    cursor.style.left = \`\${e.clientX}px\`;
    cursor.style.top = \`\${e.clientY}px\`;
});`);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Main cursor */}
      <div
        className="fixed w-5 h-5 bg-[#f39c12] rounded-full pointer-events-none z-50 transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${position.x - 10}px, ${position.y - 10}px) scale(${isHovering ? 1.2 : 1})`,
        }}
      />

      {/* Cursor trail */}
      <div
        className="fixed w-8 h-8 bg-[#f39c12]/30 rounded-full pointer-events-none z-40 transition-transform duration-200 ease-out"
        style={{
          transform: `translate(${position.x - 16}px, ${position.y - 16}px) scale(${isHovering ? 1.1 : 1})`,
        }}
      />

      {/* Code preview */}
      <div className="fixed bottom-8 right-8 w-96 bg-[#222] p-4 rounded-lg shadow-lg border border-[#f39c12]/20">
        <h3 className="text-[#f39c12] text-lg font-semibold mb-2">Generated Code:</h3>
        <pre className="bg-[#333] p-3 rounded text-[#f39c12] text-sm overflow-x-auto">
          {code}
        </pre>
      </div>
    </>
  );
};

export default CursorEffects; 