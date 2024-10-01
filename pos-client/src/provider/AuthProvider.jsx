import { createContext, useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import axios from 'axios';
import { app } from '../Firebase/firebase.config';

export const AuthContext = createContext(null);
const auth = getAuth(app);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // user create here
    const createUser = (email, password) => {
        setLoading(true);
        return createUserWithEmailAndPassword(auth, email, password);
    };

    // sign in function here
    const signIn = (email, password) => {
        setLoading(true);
        return signInWithEmailAndPassword(auth, email, password);
    };


    // update profile here
    const updateUserProfile = (name, photo) => {
        return updateProfile(auth.currentUser, {
            displayName: name,
            photoURL: photo
        });
    };

    // logout function
    const logOut = () => {
        setLoading(true);
        return signOut(auth);
    };
    // save user by role function
    const saveUser = async (user) => {
        const currentUser = {
            email: user?.email,
            name: user?.displayName,
            role: 'user',
            status: 'Verified',
        };
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_API_URL}/user`,
                currentUser
            );
            return data;
        } catch (error) {
            console.error("Error saving user:", error);
            throw error;
        }
    };

    // userEffect API here
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(true); // Start loading

            if (currentUser) {
                try {
                    // const tokenData = await getToken(currentUser.email);
                    // const userData = await saveUser(currentUser);

                    const userInfo = { email: currentUser?.email };
                    // const res = await axios.post('/jwt', userInfo);

                    // if (res.data.token) {
                    //     localStorage.setItem('access-token', res.data.token);
                    //     setLoading(false);
                    // }

                } catch (error) {
                    console.error("Error during auth state change:", error);
                } finally {
                    setLoading(false); // End loading
                }
            } else {
                localStorage.removeItem('access-token');
                setLoading(false); // End loading
            }
        });

        return () => unsubscribe();
    }, []);

    const authInfo = {
        user, loading, createUser, signIn, logOut, updateUserProfile, saveUser
    }


    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;