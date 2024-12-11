import { createContext, Show, useContext, type JSX } from 'solid-js';
import type { User } from '../../actions/authentication';
import { QueryContext } from './query/QueryController';
import Query, { withQuery } from './query/Query';
import { actions } from 'astro:actions';
import LoginEditor from './user/LoginEditor';

export const SelfContext = createContext<User>();

export interface Props {
    children: JSX.Element;
    check: (u: User) => boolean;
}

export default function (props: Props) {
    const query = useContext(QueryContext);

    return (
        <Query f={() => actions.authentication.status.orThrow()} queryKey="internal-status">
            {(user) => (
                <Show
                    when={user && props.check(user)}
                    fallback={
                        <>
                            <p>Du kannst auf diese Seite nicht zugreifen</p>
                            <Show when={!user}>
                                <LoginEditor
                                    submit={(username, password, loading) =>
                                        withQuery(
                                            () =>
                                                actions.authentication.login.orThrow({
                                                    username,
                                                    password,
                                                }),
                                            loading,
                                            false,
                                            () => {
                                                query.refetch('internal-status');
                                            }
                                        )
                                    }
                                />
                            </Show>
                        </>
                    }
                >
                    <SelfContext.Provider value={user}>{props.children}</SelfContext.Provider>
                </Show>
            )}
        </Query>
    );
}
