const buildLetter = async (data) => {
  // Build leave letter content
  return `Dear Sir/Madam,

I am writing to request leave from ${data.startDate} to ${data.endDate} due to ${data.reason}.

Sincerely,
${data.studentName}`;
};

module.exports = {
  buildLetter,
};