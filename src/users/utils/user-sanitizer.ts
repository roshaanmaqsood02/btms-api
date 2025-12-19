export function sanitizeUserByRole(user: any, role: string) {
  const sanitizedUser = { ...user };

  // PM CANNOT SEE CONTRACT DETAILS
  if (role === 'PROJECT_MANAGER') {
    delete sanitizedUser.contractType;
    delete sanitizedUser.contractStart;
    delete sanitizedUser.contractEnd;
    delete sanitizedUser.salary;
  }

  // EMPLOYEE sees even less
  if (role === 'EMPLOYEE') {
    delete sanitizedUser.contractType;
    delete sanitizedUser.contractStart;
    delete sanitizedUser.contractEnd;
    delete sanitizedUser.salary;
    delete sanitizedUser.cnic;
  }

  return sanitizedUser;
}
