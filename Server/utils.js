function getEspnDate(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0].replaceAll('-','');
}

function formatToLocal(isoString) {
    const date = new Date(isoString);

    return date.toLocaleString('en-DE', {
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
    });
}

function getDaysSinceNewYear() {
    const now = new Date(); 
    const currentYear = now.getFullYear();

    const startOfYear = new Date(currentYear, 0, 1);
    
    // Calculate difference in milliseconds
    const diffInMs = now - startOfYear;
    
    // Convert milliseconds to days
    // (1000ms * 60s * 60m * 24h)
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    console.log("diffInDays ", diffInDays);
    
    return diffInDays;
}

module.exports = { getEspnDate, formatToLocal, getDaysSinceNewYear };