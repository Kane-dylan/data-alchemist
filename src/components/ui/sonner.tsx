"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="light" // Force light theme for better readability
      className="toaster group"
      position="top-right"
      offset="20px"
      toastOptions={{
        duration: 4000,
        style: {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.2)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          color: '#000000', // Ensure black text
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:backdrop-blur-sm group-[.toaster]:text-black group-[.toaster]:border-gray-300 group-[.toaster]:shadow-lg group-[.toaster]:border group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-gray-700 group-[.toast]:text-sm font-medium",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white group-[.toast]:hover:bg-gray-800",
          cancelButton:
            "group-[.toast]:bg-gray-200 group-[.toast]:text-black group-[.toast]:hover:bg-gray-300",
          success: "group-[.toaster]:border-green-300 group-[.toaster]:bg-green-50/98 group-[.toaster]:text-black",
          error: "group-[.toaster]:border-red-300 group-[.toaster]:bg-red-50/98 group-[.toaster]:text-black",
          warning: "group-[.toaster]:border-yellow-300 group-[.toaster]:bg-yellow-50/98 group-[.toaster]:text-black",
          info: "group-[.toaster]:border-blue-300 group-[.toaster]:bg-blue-50/98 group-[.toaster]:text-black",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
