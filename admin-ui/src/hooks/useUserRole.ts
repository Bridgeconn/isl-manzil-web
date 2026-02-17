import { useEffect, useState } from "react";
import { useSessionContext } from "supertokens-auth-react/recipe/session";

const ROLE_PERMISSIONS = ["reporter", "editor", "admin"];

export const useUserRole = () => {
  const session = useSessionContext();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      if (session.loading === false && session.doesSessionExist) {
        try {
          const payload = await session.accessTokenPayload;
          const userRoles = payload["st-role"]?.v || [];
          setRoles(userRoles);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setRoles([]);
          setLoading(false);
        }
      } else {
        setRoles([]);
      }
      setLoading(false);
    };
    getUserData();
  }, [session]);

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const isAdmin = hasRole("admin");
  const isEditor = !isAdmin && hasRole("editor");
  const isReporter = !isAdmin && !isEditor && hasRole("reporter");

  const isPendingApproval = !roles.some((role) =>
    ROLE_PERMISSIONS.includes(role)
  );

  return { roles, isReporter, isEditor, isAdmin, isPendingApproval, loading };
};
