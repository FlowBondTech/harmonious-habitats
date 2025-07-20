import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { DayPicker } from "react-day-picker"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  time?: string
  setTime?: (time: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateTimePicker({
  date,
  setDate,
  time,
  setTime,
  placeholder = "Pick a date",
  className,
  disabled = false
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [showTimePicker, setShowTimePicker] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate && setTime) {
      setShowTimePicker(true)
    } else {
      setIsOpen(false)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setTime) {
      setTime(e.target.value)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-gray-500",
          className
        )}
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? (
          <>
            {format(date, "PPP")}
            {time && (
              <>
                <Clock className="ml-2 mr-1 h-4 w-4" />
                {time}
              </>
            )}
          </>
        ) : (
          <span>{placeholder}</span>
        )}
      </Button>

      {/* Mobile Slide-up Modal */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsOpen(false)
              setShowTimePicker(false)
            }}
          />
          <div className="relative w-full bg-white rounded-t-2xl shadow-xl animate-slide-up">
            <div className="p-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              
              {!showTimePicker ? (
                <>
                  <h3 className="text-lg font-semibold mb-4">Select Date</h3>
                  <DayPicker
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    className="mx-auto"
                    classNames={{
                      root: "p-3",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-10 w-10 text-center text-sm p-0 relative",
                      day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-md",
                      day_range_end: "day-range-end",
                      day_selected: "bg-forest-600 text-white hover:bg-forest-700 hover:text-white focus:bg-forest-600 focus:text-white",
                      day_today: "bg-gray-100 text-gray-900",
                      day_outside: "text-gray-400 opacity-50",
                      day_disabled: "text-gray-400 opacity-50",
                      day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                      day_hidden: "invisible",
                    }}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                    {!setTime && (
                      <Button
                        className="flex-1"
                        onClick={() => setIsOpen(false)}
                        disabled={!date}
                      >
                        Confirm
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4">Select Time</h3>
                  <input
                    type="time"
                    value={time || ""}
                    onChange={handleTimeChange}
                    className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowTimePicker(false)}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setIsOpen(false)
                        setShowTimePicker(false)
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Popover */}
      {!isMobile && isOpen && (
        <div className="absolute z-50 mt-2">
          <div
            className="fixed inset-0"
            onClick={() => {
              setIsOpen(false)
              setShowTimePicker(false)
            }}
          />
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            {!showTimePicker ? (
              <>
                <DayPicker
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  className="p-3"
                />
                {setTime && (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={time || ""}
                      onChange={handleTimeChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                    />
                    <Button
                      className="w-full mt-3"
                      onClick={() => setIsOpen(false)}
                    >
                      Confirm
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}

// Add slide-up animation to Tailwind CSS
const style = document.createElement("style")
style.textContent = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`
document.head.appendChild(style)