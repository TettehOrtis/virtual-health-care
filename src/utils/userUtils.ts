/**
 * Get user initials from full name
 * @param fullName - The user's full name
 * @returns User initials (max 2 characters)
 */
export const getUserInitials = (fullName: string): string => {
    if (!fullName || typeof fullName !== 'string') {
        return 'U';
    }

    return fullName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Get user role for navigation
 * @param role - The user's role
 * @returns Lowercase role string
 */
export const getUserRole = (role: string): string => {
    if (!role) return '';
    return role.toLowerCase();
};

/**
 * Get user dashboard URL
 * @param role - The user's role
 * @param userId - The user's ID (patientId or doctorId)
 * @returns Dashboard URL
 */
export const getDashboardUrl = (role: string, userId: string): string => {
    const userRole = getUserRole(role);
    return `/${userRole}-frontend/${userId}/dashboard`;
};

/**
 * Get user profile URL
 * @param role - The user's role
 * @param userId - The user's ID (patientId or doctorId)
 * @returns Profile URL
 */
export const getProfileUrl = (role: string, userId: string): string => {
    const userRole = getUserRole(role);
    return `/${userRole}-frontend/${userId}/profile`;
}; 