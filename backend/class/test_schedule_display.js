// Test script to verify scheduling frequency display logic
const formatDay = (day) => {
  if (!day) return '';
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5); // Remove seconds
};

const getScheduleText = (cls) => {
  if (cls.schedule && cls.schedule.frequency === 'no-schedule') {
    return 'No Schedule';
  } else if (cls.schedule && cls.schedule.day && cls.schedule.startTime && cls.schedule.endTime) {
    return `${formatDay(cls.schedule.day)} ${formatTime(cls.schedule.startTime)}-${formatTime(cls.schedule.endTime)}`;
  } else {
    return 'Schedule not set';
  }
};

// Test data from our API
const testClasses = [
  {
    id: 126,
    className: "No Grace Period Test Class",
    schedule_frequency: "weekly",
    schedule: {
      day: "",
      startTime: "00:00:00",
      endTime: "00:00:00",
      frequency: "weekly"
    }
  },
  {
    id: 129,
    className: "Monthly Test Class",
    schedule_frequency: "monthly",
    schedule: {
      day: "Saturday",
      startTime: "10:00:00",
      endTime: "12:00:00",
      frequency: "monthly"
    }
  },
  {
    id: 127,
    className: "sfsfs",
    schedule_frequency: "no-schedule",
    schedule: {
      day: null,
      startTime: null,
      endTime: null,
      frequency: "no-schedule"
    }
  },
  {
    id: 130,
    className: "Test No Schedule Class",
    schedule_frequency: "no-schedule",
    schedule: {
      day: null,
      startTime: null,
      endTime: null,
      frequency: "no-schedule"
    }
  }
];

console.log("=== Testing Schedule Display Logic ===\n");

testClasses.forEach(cls => {
  const scheduleText = getScheduleText(cls);
  console.log(`Class: ${cls.className}`);
  console.log(`Frequency: ${cls.schedule_frequency}`);
  console.log(`Schedule Data:`, cls.schedule);
  console.log(`Display Text: "${scheduleText}"`);
  console.log("---");
});

console.log("\n=== Expected Results ===");
console.log("1. Weekly class with empty schedule data -> 'Schedule not set'");
console.log("2. Monthly class with proper data -> 'Saturday 10:00-12:00'");
console.log("3. No-schedule class -> 'No Schedule'");
console.log("4. No-schedule class -> 'No Schedule'"); 