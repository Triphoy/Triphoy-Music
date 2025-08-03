import { useParams } from "react-router-dom";
import MessengerList from "../messenger/MessengerList";
import Messenger from "../messenger/Messenger";
import styles from "../messenger/Messenger.module.css";

const MessengerPage = () => {
  const { id } = useParams<{ id?: string }>();

  return (
    <div className={styles.messengerContainer}>
      <div className={styles.messengerList}>
        <MessengerList />
      </div>
      <div className={styles.chatContainer}>
        {id ? <Messenger /> : <div className={styles.emptyState}>Выберите чат выше</div>}
      </div>
    </div>
  );
};

export default MessengerPage;